Disclaimer: I am not actually that good with SQL, there many be better ways of solving these problems that I am simply unaware of.

Once upon a time I had a problem; I needed representative examples of each of an unknown number of "groups" within a dataset.

I could have accomplished this manually by first finding all the groups.

```sql
SELECT DISTINCT group_col FROM table;
```

Then fetching some examples for each group.

```sql
SELECT
  important_info
FROM
  table
WHERE group_col = "<specific example>"
ORDER BY criteria_i_care_about DESC
LIMIT <number of examples I need>
```

Repeating for however many groups I have.

For one time manual investigation with a small number of groups, this is perfectly fine. You'll get what you need and it won't take very long. If however you find yourself doing this a lot, or you find yourself in a situation with _many_ groups this approach becomes painful. I found myself in a situation where I needed a better solution, and this is when I found the following technique leveraging `ROW_NUMBER` and `PARTITION BY`.

```sql
WITH
    Records AS (
        SELECT
            important_info,
            ROW_NUMBER() OVER (
                PARTITION BY group_col
                ORDER BY critiera_i_care_about DESC
            ) row_num,
          FROM table T
        )
SELECT *
FROM Records
WHERE row_num < 2
```

This will give you the top result (based on the `critiera_i_care_about`) for each group made by `group_col`. This approach is very flexible; `PARTITION` and `ORDER` can be adjusted for more complex groups or ordering, a `WHERE` clause can be introduced to further hone in one a specific subset of the data, and the clause for the `row_num` can be adjusted for more examples or more complex requirements.

I recently used this when investigating a set of duplicate records that had somehow ended up in our application database at work. Adjusting the partitioning to group together records that are "duplicates" of each other, we queried for `row_num > 1` to give all the ones that needed to be purged.
