SELECT date_trunc('day', dd):: date
FROM generate_series
        ( '2023-10-01'::timestamp 
        , '2023-11-21'::timestamp
        , '1 day'::interval) dd;