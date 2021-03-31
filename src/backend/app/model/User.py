from shared import db


class User(db.Model):
    __tablename__ = "user"

    uuid = db.Column("uuid", db.BINARY(16), primary_key=True)   # PK
    creation_time = db.Column("creation_time", db.Integer, nullable=False)
    email = db.Column("email", db.String(256), unique=True)
    alias = db.Column("alias", db.String(256), nullable=True)
    bio = db.Column("bio", db.Text, nullable=True)
    password_salt = db.Column("password_salt", db.BINARY(16), nullable=False)
    password_hash = db.Column("password_hash", db.BINARY(20), nullable=False)
    r_group = db.relationship("Group", backref="creator", lazy=True, uselist=False)

    def __repr__(self):
        return f"<User {self.uuid.hex()}: {self.email}>"
