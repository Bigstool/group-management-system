from shared import db


class GroupApplication(db.Model):
    __tablename__ = "group_application"

    uuid = db.Column("uuid", db.BINARY(16), primary_key=True)  # PK
    creation_time = db.Column("creation_time", db.Integer, nullable=False)
    applicant_uuid = db.Column("applicant_uuid", db.BINARY(16), db.ForeignKey("user.uuid"), nullable=False)
    group_uuid = db.Column("group_uuid", db.BINARY(16), db.ForeignKey("group.uuid"), nullable=False)
    comment = db.Column("comment", db.String(4096), nullable=True)
    state = db.Column("state", db.String(256), nullable=False)
    r_group = db.relationship("Group", backref="application", lazy=True, uselist=True)