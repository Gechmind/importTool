-- 长度需要根据实际情况调整
select
CONCAT_ws(",",
(select max(id)+10 from product.category_tree where LENGTH(`id`) < 5) ,
(select max(id)+10 from product.category where LENGTH(`id`) < 8) ,
(select max(id)+10 from product.category_tree_node  where LENGTH(`id`) < 8) , 
(select max(id)+10 from product.page  where LENGTH(`id`) < 8) ,
(select max(id)+10 from product.page_category_tree  where LENGTH(`id`) < 8),
(select max(id)+10 from product.category_tree_node_relation  where LENGTH(`id`) < 8) ,
(select max(id)+10 from product.brand  where LENGTH(`id`) < 8) ,
(select max(id)+10 from product.attribute_name  where LENGTH(`id`) < 8) ,
(select max(id)+10 from product.attribute_value  where LENGTH(`id`) < 8) ,
(select max(id)+10 from product.category_att_name  where LENGTH(`id`) < 8) ,
(select max(id)+10 from product.category_att_value  where LENGTH(`id`) < 8) ,
(select max(id)+10 from stock.warehouse  where LENGTH(`id`) < 8) ,
(select max(id)+10 from stock.merchant_warehouse  where LENGTH(`id`) < 8) )
 from dual


-- 长度需要根据实际情况调整
select
(select max(id)+10 from product.category_tree where LENGTH(`id`) < 5) as  categoryTreeIdGe,
(select max(id)+10 from product.category where LENGTH(`id`) < 8) as categoryIdGe ,
(select max(id)+10 from product.category_tree_node  where LENGTH(`id`) < 8) as categoryTreeNodeGe, 
(select max(id)+10 from product.page  where LENGTH(`id`) < 8) as pageIdGe,
(select max(id)+10 from product.page_category_tree  where LENGTH(`id`) < 8) as pageCategoryTreeIdGe,
(select max(id)+10 from product.category_tree_node_relation  where LENGTH(`id`) < 8) as relatinIdGe,
(select max(id)+10 from product.brand  where LENGTH(`id`) < 8) as brandIdGe,
(select max(id)+10 from product.attribute_name  where LENGTH(`id`) < 8) as attrNameIdGe,
(select max(id)+10 from product.attribute_value  where LENGTH(`id`) < 8) as attrValueIdGe,
(select max(id)+10 from product.category_att_name  where LENGTH(`id`) < 8) as categoryAttNameIdGe,
(select max(id)+10 from product.category_att_value  where LENGTH(`id`) < 8) as categoryAttValueIdGe,
(select max(id)+10 from stock.warehouse  where LENGTH(`id`) < 8) as warehouseIdGe,
(select max(id)+10 from stock.merchant_warehouse  where LENGTH(`id`) < 8) as merchantWareIdGe
 from dual
