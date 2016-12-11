update product.attribute_name set company_id = 12;
update product.attribute_value set company_id = 12;

update product.brand set company_id = 12;

update product.category set company_id = 12;
update product.category_att_name set company_id = 12;
update product.category_att_value set company_id = 12;
update product.category_tree set company_id = 12;
update product.category_tree_node set company_id = 12;
update product.page  set company_id = 12;
update product.page_category_tree  set company_id = 12;
update product.category_tree_node_relation  set company_id = 12;

update product.product set company_id = 12;
update product.product_att_name set company_id = 12;
update product.product_att_value set company_id = 12;
update product.product_picture set company_id = 12;
update product.picture set company_id = 12;

update product.merchant_product set company_id = 12;
update product.merchant_prod_att_name set company_id = 12;
update product.merchant_prod_att_value set company_id = 12;
update product.merchant_prod_describe  set company_id = 12;

update product.merchant_prod_picture set company_id = 12;
update product.merchant_picture set company_id = 12;
	
update price.merchant_product_price set company_id = 12;
update price.merchant_product_price_history set company_id = 12;
update price.merchant_product_promotion set company_id = 12;

update  product.merchant_series set company_id = 12;
update  product.merchant_series_product_att set company_id = 12;


update   stock.warehouse set company_id = 12;
update   stock.merchant_warehouse set company_id = 12;
update   stock.merchant_product_warehouse_stock set company_id = 12;

# merchantId

update product.merchant_picture set merchant_id = 101;
update product.merchant_cate_tree set merchant_id = 101;
update product.merchant_product set merchant_id = 101;

update price.merchant_product_price set merchant_id = 101;
update price.merchant_product_price_history set merchant_id = 101;
update price.merchant_product_promotion set merchant_id = 101;

update stock.merchant_product_warehouse_stock set merchant_id = 101;
update stock.merchant_warehouse set merchant_id = 101;

update  product.merchant_series set merchant_id = 101;
