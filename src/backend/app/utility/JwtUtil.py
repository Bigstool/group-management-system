import jwt


class JwtUtil:
    algorithm: str
    private_key: bytes
    public_key: bytes

    def __init__(self,
                 private_key,
                 public_key,
                 algorithm):
        self.algorithm = algorithm
        with open(public_key, 'rb') as public_key_file, open(private_key, 'rb') as private_key_file:
            self.public_key = public_key_file.read()
            self.private_key = private_key_file.read()

    def encode_token(self, payload: dict) -> str:
        return jwt.encode(payload, self.private_key, algorithm=self.algorithm)

    def decode_token(self, token: str, **kwargs) -> dict:
        return jwt.decode(token, self.public_key, audience=kwargs["audience"], algorithms=self.algorithm)
