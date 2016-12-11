运行环境要求：
nodejs 6.4 以上
(js-xlsx读取浮点数据时会用到Math.log()计算精度，6.4以前版本V8执行log方法会静默退出)


数据导入和装换

0、JSON数据准备

1、品牌导入：

+ 脚本名称
    +  brand.js 
+ 执行内容
    + 从产品品牌数据中提取品牌集合(去重后插入数据库),并输出品牌和Id的映射关系
+ 文件输入
    + brand.json  产品数据中的所有产品品牌数据，顺序和csv中一致
+ 文件输出
+    brandMapping.json  品牌原始数据和数据库数据映射 [[品牌名:品牌Id]..]

2、品牌数据转换：

+ 脚本名称
    +  brandconvert.js     
+ 执行内容
    + 把原始产品数据中原始品牌替换成品牌Id
+ 文件输入
    + brand.json  产品数据中的所有产品品牌数据，顺序和csv中一致
    + brandMapping.json
+ 文件输出
    + brandId.json
    + **brand_id_out.txt 替换后的品牌数据,直接放入原始csv中即可**

3、属性导入:

+ 脚本名称
    +  attribute.js
+ 执行内容
    + 从产品原始的属性对中提取出属性的 name-valueList集合, 去重并归集一个属性名的所有属性值，插入数据库。 
+ 文件输入
    + attribute.json  产品中的所有属性数据，[{name1:value1,name2:value1}..]
+ 文件输出
    + attributeMapping.json  所有属性名值对和其Id的映射[{name_value:[nameId,valueId]}...]
    + **reion_out.txt   从属性中提取的产地,直接放入导入CSV中**
    + **standar_out.txt 从属性中提取的规格,直接放入导入CSV中**
    + **weight_out.txt  从属性中提取的净重,直接放入导入CSV中**

4、属性转换：

+ 脚本名称
    +  attributeconvert.js
+ 执行内容
    + 原始产品的属性名值全部转换成{nameId:valueId},同时去除产地、规格、净重等独立属性。
+ 文件输入
    + attribute.json    
    + attributeMapping.json
+ 文件输出
    + attributeIdPair.json  **attribute_out的Json形式文件**
    + attribute_out.txt **转换后的Id键值对，直接放入导入CSV中**   

5、类目导入:

+ 脚本名称
    +  category.js
+ 执行内容
    + 原始数据中类目梳理出层级关系，从外层到内层导入
+ 文件输入
    + category.json 这个需要对原先抓取数据处理后生成的Json文件，每条json数据格式[[code,parentcode,name,url,level,leaf]...] 
+ 文件输出
    + categoryMapping.json  原始的类目code和id的映射，[[code:id]...] **step 6使用**

6、类目装换：

+ 脚本名称
    +  categorycodeconvert.js
+ 执行内容
    + 转换产品输入中的类目code
+ 文件输入
    +  categoryMapping.json
    +  pr_cate_in.json 产品数据中的code值，按顺序转成Json格式
+ 文件输出
    +  categoryId.json  **pr_cate_out的Json形式文件，Step 7 使用**
    +  pr_cate_out.json **按输入顺序转后的类目id文件，直接贴入CSV中**     

7、类目属性导入：

+ 脚本名称
    +  categoryAttr.js
+ 执行内容
    + 通过产品数据中的类目code和属性名值的匹配关系来反推一份类目属性数据，同时写入类目属性的值。
+ 文件输入
    +  attributeIdPair.json   
    +  categoryId.json

8、~~产品导入，商品继承~~ __@deprecate__

+ 执行准备
    +   2、3、4步骤中的txt文件放入到产品数据对应的栏目，替换原始数据
    +   启动odss项目，通过csv导入完成本步骤
+ 执行内容
    +   导入产品，并继承一份商品数据
    +   商家Id，odss默认设置 1001，导入时页面设置odss company_id　1001

9、 ~~价格导入~~：__@deprecate__

+ 脚本名称
    +   price.js
+ 执行内容
    +   通过产品code关联查询产品表和商品表获取商品Id，插入价格数据
+ 文件输入
    +    productCode.json
    +    price.json           

10、 仓库、库存数据导入:

+ 脚本名称
    +   wareHouseStock.js
+ 执行内容
    +   根据仓库名称，商家ID，公司ID设置默认仓库数据
    +   ~~库存数据导入~~  __@deprecate__ 

11、 生成csv文件供后台导入


12、脚本后续功能:

+ 本地表的自动创建，自动清理脚本
+ ~~产品导入，商品继承实现~~  __@deprecate__
+ 原始数据的替换自动实现。 
+ 添加Promise链的异常处理，提升可靠性能   __部分实现__
+ 导入和转换功能合并，步骤的串行执行，实现一键完成导入  __已实现__
+ 所有数据库表操作计数并统计输出  

+ 多产品数据目录自动归集功能，grunt实现
+ 流数据装换，导出对应的JSON数据集。 __已实现__

+ 不需要全量读取的数据用流的方式替换
+ nodejs  es6切换后，验证csv文件读取


