# 数据清理
#属性清理
TRUNCATE  table product.attribute_name;
TRUNCATE  table product.attribute_value;

#品牌清理
TRUNCATE  table product.brand;
 
#类目清理
TRUNCATE  table product.category;
TRUNCATE  table product.category_att_name;
TRUNCATE  table product.category_att_value;
TRUNCATE  table product.category_tree;
TRUNCATE  table product.category_tree_node;
TRUNCATE  table product.page;
TRUNCATE  table product.page_category_tree;
TRUNCATE  table product.category_tree_node_relation;

#仓库清理
TRUNCATE  table stock.warehouse;
TRUNCATE  table stock.merchant_warehouse;

#产品清理：基本信息、产品属性、 产品图片
TRUNCATE  table  product.product;
TRUNCATE  table  product.product_att_name;
TRUNCATE  table  product.product_att_value;
TRUNCATE  table  product.product_picture;
TRUNCATE  table  product.picture;
TRUNCATE  table  product.merchant_picture;
 
#商品清理：基本信息、商品属性、 商品图片
TRUNCATE  table  product.merchant_product;
TRUNCATE  table  product.merchant_prod_att_name;
TRUNCATE  table  product.merchant_prod_att_value;
TRUNCATE  table  product.merchant_prod_describe;
TRUNCATE  table  product.merchant_prod_picture;

TRUNCATE  table  product.merchant_series;
TRUNCATE  table  product.merchant_series_product_att;

#商品价格
TRUNCATE  table price.merchant_product_price;
TRUNCATE  table price.merchant_product_price_history;
TRUNCATE  table price.merchant_product_promotion;

#商品库存
TRUNCATE  table stock.merchant_product_warehouse_stock