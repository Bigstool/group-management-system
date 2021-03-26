from shared import db


class User(db.Model):
    uuid = db.Column('uuid', db.BINARY(16), primary_key=True)
    email = db.Column('email', db.VARCHAR(256), unique=True)
    alias = db.Column('alias', db.VARCHAR(256), nullable=True)
    bio = db.Column('bio', db.TEXT, nullable=True)
    password_salt = db.Column('password_salt', db.BINARY(16), nullable=False)
    password_hash = db.Column('password_hash', db.BINARY(20), nullable=False)
    creation_time = db.Column('creation_time', db.INTEGER, nullable=False)

    def __repr__(self):
        return f"<User {self.uuid}: {self.email}>"