from shared import db
import uuid

class User(db.Model):
    uuid = db.Column('uuid', db.String(36), default=uuid.uuid4().hex, primary_key=True)
    email = db.Column('email', db.String(256), unique=True)
    alias = db.Column('alias', db.String(256), nullable=True)
    bio = db.Column('bio', db.Text, nullable=True)
    password_salt = db.Column('password_salt', db.BINARY(16), nullable=False)
    password_hash = db.Column('password_hash', db.BINARY(20), nullable=False)
    creation_time = db.Column('creation_time', db.Integer, nullable=False)

    def __repr__(self):
        return f"<User {self.uuid}: {self.email}>"

    def gen_id(self):
        return uuid.uuid4().hex

