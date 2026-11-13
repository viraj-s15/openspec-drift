import { describe, expect, it } from 'vitest';
import { Catalog } from '../src/catalog.js';

describe('catalog search', () => {
  function setup() {
    const catalog = new Catalog();
    catalog.addBook('1', 'The Left Hand of Darkness', 'Ursula Le Guin', ['a']);
    catalog.addBook('2', 'Dune', 'Frank Herbert', ['b']);
    catalog.setCopyStatus('a', 'on loan');
    return catalog;
  }

  it('matches title substrings case-insensitively even when on loan', () => {
    expect(setup().search('LEFT hand').map(book => book.isbn)).toEqual(['1']);
  });

  it('matches author substrings case-insensitively', () => {
    expect(setup().search('HERB').map(book => book.isbn)).toEqual(['2']);
  });

  it('returns no books for a non-matching query', () => {
    expect(setup().search('missing')).toEqual([]);
  });

  it('returns each book once for an empty query', () => {
    expect(setup().search('').map(book => book.isbn)).toEqual(['1', '2']);
  });

  it('returns detached snapshots and does not duplicate title and author matches', () => {
    const catalog = new Catalog();
    catalog.addBook('1', 'Dune', 'Dune author', ['a']);
    const results = catalog.search('dune');
    expect(results).toHaveLength(1);
    results[0].copies[0].status = 'on loan';
    expect(catalog.getBook('1')?.copies[0].status).toBe('available');
  });
});

describe('catalog books and copies', () => {
  it('adds a book with available physical copies', () => {
    const catalog = new Catalog();
    catalog.addBook('isbn-1', 'Dune', 'Frank Herbert', ['a', 'b']);
    expect(catalog.getBook('isbn-1')).toEqual({
      isbn: 'isbn-1', title: 'Dune', author: 'Frank Herbert',
      copies: [{ id: 'a', status: 'available' }, { id: 'b', status: 'available' }],
    });
  });

  it('rejects duplicate ISBNs without changing the book', () => {
    const catalog = new Catalog();
    catalog.addBook('1', 'Original', 'Author', ['a']);
    expect(() => catalog.addBook('1', 'Other', 'Other', ['b'])).toThrow();
    expect(catalog.getBook('1')?.title).toBe('Original');
    catalog.addBook('2', 'Other', 'Other', ['b']);
  });

  it('rejects books with no copies', () => {
    const catalog = new Catalog();
    expect(() => catalog.addBook('1', 'Title', 'Author', [])).toThrow();
    expect(catalog.getBook('1')).toBeUndefined();
  });

  it('rejects repeated or already registered copy IDs atomically', () => {
    const catalog = new Catalog();
    catalog.addBook('1', 'Title', 'Author', ['a']);
    expect(() => catalog.addBook('2', 'Title', 'Author', ['b', 'b'])).toThrow();
    expect(() => catalog.addBook('2', 'Title', 'Author', ['b', 'a'])).toThrow();
    expect(catalog.getBook('2')).toBeUndefined();
    catalog.addBook('2', 'Title', 'Author', ['b']);
  });

  it('updates one copy independently through loan and return', () => {
    const catalog = new Catalog();
    catalog.addBook('1', 'Title', 'Author', ['a', 'b']);
    catalog.setCopyStatus('a', 'on loan');
    expect(catalog.getBook('1')?.copies).toEqual([
      { id: 'a', status: 'on loan' }, { id: 'b', status: 'available' },
    ]);
    catalog.setCopyStatus('a', 'available');
    expect(catalog.getBook('1')?.copies.every(copy => copy.status === 'available')).toBe(true);
  });

  it('looks up detached copies and returns undefined for unknown IDs', () => {
    const catalog = new Catalog();
    catalog.addBook('1', 'Title', 'Author', ['a']);
    const copy = catalog.getCopy('a')!;
    expect(copy).toEqual({ id: 'a', status: 'available' });
    expect(catalog.getCopy('missing')).toBeUndefined();
    copy.id = 'changed';
    copy.status = 'on loan';
    expect(catalog.getCopy('a')).toEqual({ id: 'a', status: 'available' });
  });

  it('tracks reserved status and copy ISBN without exposing catalog state', () => {
    const catalog = new Catalog();
    catalog.addBook('1', 'Title', 'Author', ['a', 'b']);
    catalog.setCopyStatus('a', 'reserved');
    expect(catalog.getCopyIsbn('a')).toBe('1');
    expect(catalog.getCopyIsbn('missing')).toBeUndefined();
    const book = catalog.getBook('1')!;
    expect(book.copies).toEqual([{ id: 'a', status: 'reserved' }, { id: 'b', status: 'available' }]);
    book.copies[0].status = 'available';
    expect(catalog.getCopy('a')?.status).toBe('reserved');
  });

  it('rejects updates for unknown copies', () => {
    expect(() => new Catalog().setCopyStatus('missing', 'on loan')).toThrow();
  });

  it('returns snapshots that cannot mutate the catalog', () => {
    const catalog = new Catalog();
    catalog.addBook('1', 'Title', 'Author', ['a']);
    const book = catalog.getBook('1')!;
    book.title = 'Changed';
    book.copies[0].status = 'on loan';
    book.copies.length = 0;
    expect(catalog.getBook('1')).toEqual({
      isbn: '1', title: 'Title', author: 'Author', copies: [{ id: 'a', status: 'available' }],
    });
  });
});
