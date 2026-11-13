export type CopyStatus = 'available' | 'on loan';

export interface Copy {
  id: string;
  status: CopyStatus;
}

export interface Book {
  isbn: string;
  title: string;
  author: string;
  copies: Copy[];
}

export class Catalog {
  private readonly books = new Map<string, Book>();
  private readonly copies = new Map<string, Copy>();

  addBook(isbn: string, title: string, author: string, copyIds: string[]): void {
    if (this.books.has(isbn)) throw new Error('ISBN already exists');
    if (copyIds.length === 0) throw new Error('A book must have at least one copy');
    if (new Set(copyIds).size !== copyIds.length || copyIds.some(id => this.copies.has(id))) {
      throw new Error('Copy ID already exists');
    }

    const copies: Copy[] = copyIds.map(id => ({ id, status: 'available' }));
    this.books.set(isbn, { isbn, title, author, copies });
    for (const copy of copies) this.copies.set(copy.id, copy);
  }

  getBook(isbn: string): Book | undefined {
    const book = this.books.get(isbn);
    return book && this.snapshot(book);
  }

  search(query: string): Book[] {
    const needle = query.toLowerCase();
    return [...this.books.values()]
      .filter(book => book.title.toLowerCase().includes(needle) || book.author.toLowerCase().includes(needle))
      .map(book => this.snapshot(book));
  }

  setCopyStatus(copyId: string, status: CopyStatus): void {
    const copy = this.copies.get(copyId);
    if (!copy) throw new Error('Unknown copy');
    copy.status = status;
  }

  private snapshot(book: Book): Book {
    return { ...book, copies: book.copies.map(copy => ({ ...copy })) };
  }
}
