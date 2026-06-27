"""Token encryption at rest (FR-002).

The GitHub OAuth access token is encrypted with a symmetric Fernet key before it
touches Postgres, and decrypted only server-side when calling the GitHub API.
The plaintext token never leaves the gateway process.
"""

from __future__ import annotations

from cryptography.fernet import Fernet


class TokenCipher:
    """Thin wrapper over Fernet for encrypting/decrypting OAuth tokens.

    Construction fails fast on an invalid key, so a misconfigured
    TOKEN_ENCRYPTION_KEY surfaces at startup rather than at first use.
    """

    def __init__(self, key: str) -> None:
        # Fernet validates the key (32 url-safe base64 bytes) and raises otherwise.
        self._fernet = Fernet(key.encode() if isinstance(key, str) else key)

    def encrypt(self, plaintext: str) -> bytes:
        return self._fernet.encrypt(plaintext.encode())

    def decrypt(self, ciphertext: bytes) -> str:
        return self._fernet.decrypt(ciphertext).decode()


def cipher_from_settings() -> TokenCipher:
    from specdeck_gateway.config import get_settings

    return TokenCipher(get_settings().token_encryption_key)
