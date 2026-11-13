# Sourced by every script that calls pi, so the binary and model are set in one place.
# Override either from the environment, for example PI_BIN=pi on installs that name the binary pi.
export PI_BIN="${PI_BIN:-pi-bolt}"
export PI_MODEL="${PI_MODEL:-openai/gpt-6.1-terra:high}"
