-- Trigger: t_fifo_last_trade_check_delete

-- DROP TRIGGER IF EXISTS t_fifo_last_trade_check_delete ON public.dtrades_allocated_fifo;

CREATE TRIGGER t_fifo_last_trade_check_delete
    BEFORE DELETE
    ON public.dtrades_allocated_fifo
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_fifo_last_trade_check_delete();