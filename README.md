# CPT202_GMS
Official repository of the CPT202 Group Management System

## Changes made

* `role` field added to `User` model, values: enum("ADMIN", "USER")

## Task

- [ ] Insert dummy data (TODO)

- [ ] Implement semester

A `semester` string field must be added to each object, with default value `CURRENT`. 

When archived by admin, all semester field of objects with value `CURRENT` must be changed to the admin defined keyword. 

Add a filter `semester` to API `GET /group`

Return the list of archived semester keywords in system API

If semester of the user not `CURRENT`, disallow login. 
