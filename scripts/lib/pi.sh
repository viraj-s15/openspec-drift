# Sourced by every script that calls pi, so the binary and models are set in one place.
# Override any of them from the environment, for example PI_BIN=pi on installs that name the binary pi.
export PI_BIN="${PI_BIN:-pi-bolt}"
# Builds the baseline and the scenarios.
export PI_MODEL="${PI_MODEL:-openai/gpt-6.1-terra:high}"
# Judges in OpenSpec verify and local spec-alignment. It differs from the builder so no model grades its own work.
export PI_JUDGE_MODEL="${PI_JUDGE_MODEL:-openai/gpt-6.1-sol:low}"
