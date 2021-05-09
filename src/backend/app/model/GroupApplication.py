from shared import db


class GroupApplication(db.Model):
    __tablename__ = "group_application"

    # attr
    uuid = db.Column(db.BINARY(16), primary_key=True)  # PK
    creation_time = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.String(4096))

    # rel
    applicant_uuid = db.Column(db.BINARY(16), db.ForeignKey("user.uuid", ondelete="CASCADE", onupdate="CASCADE"))   # FK
    applicant = db.relationship("User")

    group_uuid = db.Column(db.BINARY(16), db.ForeignKey("group.uuid", ondelete="CASCADE", onupdate="CASCADE"))  # FK
    group = db.relationship("Group")
