create or replace function public.a_test (p_secid text) 
returns setof mmoexsecurities
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
select * from mmoexsecurities 
where p_secid IS NULL OR (secid=p_secid) ;
end;
 $BODY$