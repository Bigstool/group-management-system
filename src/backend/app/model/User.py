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
    # r_group = db.relationship("Group", backref="owner", lazy=True, uselist=False)
    r_group_comment = db.relationship("GroupComment", backref="author", lazy=True)
    r_group_application = db.relationship("GroupApplication", backref="applicant", lazy=True)

    #change
    group_id = db.Column("group_id", db.BINARY(16), db.ForeignKey("group.uuid"))
    r_group_favorite = db.relationship("GroupFavorite", backref="follower", lazy=True)
    group = db.relationship("Group", backref ="member", lazy=True)

    def __repr__(self):
        return f"<User {self.uuid.hex()}: {self.email}>"
