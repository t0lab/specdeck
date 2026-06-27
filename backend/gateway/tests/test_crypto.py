"""T007 — token crypto (FR-002). OAuth tokens are Fernet-encrypted at rest."""

from __future__ import annotations

import pytest
from cryptography.fernet import Fernet

from specdeck_gateway.core.crypto import TokenCipher


def test_encrypt_decrypt_roundtrip() -> None:
    cipher = TokenCipher(Fernet.generate_key().decode())
    token = "gho_secretAccessToken123"  # noqa: S105 (test fixture)
    ct = cipher.encrypt(token)
    assert cipher.decrypt(ct) == token


def test_ciphertext_differs_from_plaintext() -> None:
    cipher = TokenCipher(Fernet.generate_key().decode())
    token = "gho_secretAccessToken123"  # noqa: S105
    ct = cipher.encrypt(token)
    assert isinstance(ct, bytes)
    assert token.encode() not in ct


def test_wrong_key_cannot_decrypt() -> None:
    enc = TokenCipher(Fernet.generate_key().decode())
    dec = TokenCipher(Fernet.generate_key().decode())
    ct = enc.encrypt("gho_secretAccessToken123")  # noqa: S105
    with pytest.raises(Exception):
        dec.decrypt(ct)


def test_invalid_key_rejected_at_construction() -> None:
    with pytest.raises(Exception):
        TokenCipher("not-a-valid-fernet-key")
