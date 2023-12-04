drop FUNCTION if exists f_com_reduce_array_mult (numeric[]);
CREATE OR REPLACE FUNCTION f_com_reduce_array_mult (numeric[]) RETURNS numeric AS
$func$
DECLARE
    el numeric;
    reduce_result numeric := 1;
BEGIN
    FOREACH el IN ARRAY $1 LOOP
        reduce_result := el * reduce_result;
    END LOOP;
    RETURN reduce_result;
END;
$func$ LANGUAGE plpgsql STABLE;