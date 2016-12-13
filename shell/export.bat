rem = 之间不能有空格..哎 js 写多了
SET mysqldumpExePath="C:\Program Files\mysql-5.6.31-winx64\bin\mysqldump.exe"
SET dbHost=172.16.1.30
SET dbUser=root
set dbPassword=root
set rootPath=%~dp0 
set savePath= "C:\Program Files\Git\importTool\csv\"

IF NOT EXIST %savePath% (
	mkdir %savePath%
)

%mysqldumpExePath% -h %dbHost% --database product --table attribute_name --no-create-info --complete-insert --extended-insert=false --user=%dbUser% --password=%dbPassword% > %savePath%\attribute_name.sql
%mysqldumpExePath% -h %dbHost% --database product --table attribute_value --no-create-info --complete-insert --extended-insert=false --user=%dbUser% --password=%dbPassword% > %savePath%\attribute_value.sql
%mysqldumpExePath% -h %dbHost% --database product --table brand --no-create-info --complete-insert --extended-insert=false --user=%dbUser% --password=%dbPassword% > %savePath%\brand.sql
%mysqldumpExePath% -h %dbHost% --database product --table category --no-create-info --complete-insert --extended-insert=false --user=%dbUser% --password=%dbPassword% > %savePath%\category.sql
%mysqldumpExePath% -h %dbHost% --database product --table category_att_name --no-create-info --complete-insert --extended-insert=false --user=%dbUser% --password=%dbPassword% > %savePath%\category_att_name.sql
%mysqldumpExePath% -h %dbHost% --database product --table category_att_value --no-create-info --complete-insert --extended-insert=false --user=%dbUser% --password=%dbPassword% > %savePath%\category_att_value.sql
%mysqldumpExePath% -h %dbHost% --database product --table category_tree --no-create-info --complete-insert --extended-insert=false --user=%dbUser% --password=%dbPassword% > %savePath%\category_tree.sql
%mysqldumpExePath% -h %dbHost% --database product --table category_tree_node --no-create-info --complete-insert --extended-insert=false --user=%dbUser% --password=%dbPassword% > %savePath%\category_tree_node.sql
%mysqldumpExePath% -h %dbHost% --database product --table page --no-create-info --complete-insert --extended-insert=false --user=%dbUser% --password=%dbPassword% > %savePath%\page.sql
%mysqldumpExePath% -h %dbHost% --database product --table page_category_tree --no-create-info --complete-insert --extended-insert=false --user=%dbUser% --password=%dbPassword% > %savePath%\page_category_tree.sql
%mysqldumpExePath% -h %dbHost% --database product --table category_tree_node_relation --no-create-info --complete-insert --extended-insert=false --user=%dbUser% --password=%dbPassword% > %savePath%\category_tree_node_relation.sql


%mysqldumpExePath% -h %dbHost% --database stock --table warehouse --no-create-info --complete-insert --extended-insert=false --user=%dbUser% --password=%dbPassword% > %savePath%\warehouse.sql
%mysqldumpExePath% -h %dbHost% --database stock --table merchant_warehouse --no-create-info --complete-insert --extended-insert=false --user=%dbUser% --password=%dbPassword% > %savePath%\merchant_warehouse.sql


rem pause
