CREATE TRIGGER bulk_order_status_client_update 
AFTER UPDATE OF status ON dorders as bulk_orders
FOR EACH ROW 
EXECUTE FUNCTION f_orders_client_orders_status_update();