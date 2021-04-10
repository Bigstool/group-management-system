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

## Code style hint

* format before commit (Code > Auto format code)

* Use raise to break long if else for better readability and compatibility for future change
    Example:
    ```
    # Better practice
    if user_should_not_do_this_due_to_a:
        raise Exception("No, you can't because A")
        
    if user_should_not_do_this_due_to_b:
        raise Exception("No, you can't because B")
        
    result = continue_normal_procedure()
    return result
    
    # Not so good
    if user_can_do_this:
        result = continue_normal_procedure()
        return result
    elif case_a:
        raise Exception("No, you can't because A")
    elif case_b:
        raise Exception("No, you can't because B")
    ```
    
* Remove TODO keyword from comment if task completed
