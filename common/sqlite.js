const db = {
    dbName: 'db_accounts', // 数据库名称
    dbPath: '_doc/accounts.db', // 数据库地址,推荐以下划线为开头   _doc/xxx.db
	
	/**
	  * @Description: 创建数据库 或 有该数据库就打开
	  */
	open() {
	    return new Promise((resolve, reject) => {
			// 打开数据库
			plus.sqlite.openDatabase({
			    name: this.dbName,
			    path: this.dbPath,
			    success(e) {
				    resolve(e); 
			    },
			    fail(e) {
				    reject(e); 
			    }
			})
	    })
	},
	/**
	  * @Description: 判断数据库是否打开  数据库打开了就返回 true,否则返回 false
	  */
    isOpen() {
		var open = plus.sqlite.isOpenDatabase({
		    name: this.dbName,  // 数据库名称
		    path: this.dbPath  // 数据库地址
		})
		return open;
    },
	/**
	  * @Description: 创建表（executeSql是执行增删改等操作的SQL语句）
	  */
    ExecuteSQL(sql) {
		return new Promise((resolve, reject) => {
		    plus.sqlite.executeSql({
				name: this.dbName,
				sql: sql,
				success(e) {
				    resolve(e);
				},
				fail(e) {
				    reject(e);
				}
		    })
		})
    },
	/**
	  * @Description: 查询表数据
	  */
	getTable(dbTable){
	  	return new Promise((resolve, reject) => {
			plus.sqlite.selectSql({
				name: this.dbName,
				sql: `SELECT * FROM ${dbTable}`,
				success(e) {
					resolve(e);
				},
				fail(e) {
					console.log(e)
					reject(e);
				}
			})
	  	})
	},
	/**
	  * @Description: 查询数据库所有表
	  */
	QueryTables(condition=''){
		return new Promise((resolve, reject) => {
			plus.sqlite.selectSql({
				name: this.dbName,
				sql: "SELECT * FROM sqlite_master WHERE type='table'"+condition,
				success(e) {
					resolve(e);
				},
				fail(e) {
					console.log(e)
					reject(e);
				}
			})
		})
	},
	/**
	  * @Description: 查询数据库下的所有表
	  */
	selectTableName(){
		return new Promise((resolve, reject) => {
			plus.sqlite.selectSql({
				name: this.dbName,
				sql: "select * FROM db_accounts where type='table'",
				success(e) {
					resolve(e);
				},
				fail(e) {
					console.log(e)
					reject(e);
				}
			})
		})
	},
	/**
	  * @Description: 新增数据
	  * 向表格里添加数据 sql:'INSERT INTO dbTable VALUES('x','x','x')'   对应新增
	  * 或者 sql:'INSERT INTO dbTable ('x','x','x') VALUES('x','x','x')'   具体新增
	  * 插入 INSERT INTO  、 dbTable 是表名、根据表头列名插入列值
	  */
	//使用
	// let arr = [
	//     {id:121,dept_id: '100',dept_name: '你好呀'},
	// 	   {id:332,dept_id: '200',dept_name: '你好呀'},
	// ]
	// arr.map((item) => {
	//     let condition = "'id','dept_id','dept_name'"
	//     let data = `'${item.id}','${item.dept_id}','${item.dept_name}'`
	//     DB.insertTableData('表名',数据,字段).then((res) => {})
	// 	  .catch((error) => {
	// 	    console.log('失败', error)
	// 	  })
	// })
	insertTableData(dbTable, data, condition) {
	    // 判断有没有传参
	    if (dbTable !== undefined && data !== undefined) {
			// 判断传的参是否有值
			var bol = (JSON.stringify(data) == "{}");
			// if (!bol) {
				if (condition == undefined) var sql = `INSERT INTO ${dbTable} VALUES '${data}'`;
				else var sql = `INSERT INTO ${dbTable} (${condition}) VALUES ${data}`;
			    return new Promise((resolve, reject) => {
					// 表格添加数据
					plus.sqlite.executeSql({
					  name: this.dbName,
					  sql: sql,
					  success(e) {
						resolve(e);
					  },
					  fail(e) {
						reject(e);
					  }
					})
			    })
			// } else {
			//   return new Promise((resolve, reject) => { reject("错误添加") })
			// }
		} else {
			return new Promise((resolve, reject) => { reject("错误添加") })
	    }
	},
	/**
	  * @Description: 数据库建表
	  * 数据库建表 sql:'CREATE TABLE IF NOT EXISTS dbTable("id" varchar(50),"name" TEXT) 
	  * 创建 CREATE TABLE IF NOT EXISTS 、 dbTable 是表名，不能用数字开头、括号里是表格的表头
	  */
    // 使用
	// DB.createTable('bus_mzpy','"id" INTEGER PRIMARY KEY AUTOINCREMENT,"mzpy_name" TEXT ,"dept_id" INTEGER ,"dept_name" TEXT ,"mzpy_concent" TEXT')
    createTable(dbTable, data) {
		return new Promise((resolve, reject) => {
		    // executeSql: 执行增删改等操作的SQL语句
		    plus.sqlite.executeSql({
				name: this.dbName,
				sql: `CREATE TABLE IF NOT EXISTS ${dbTable}(${data})`,
				success(e) {
					// console.log(e)
				    resolve(e);
				},
				fail(e) {
				    reject(e);
				}
		    })
		})
    },
	/**
	  * @Description: 数据库删表 sql:'DROP TABLE dbTable'
	  */
    dropTable(dbTable) {
		return new Promise((resolve, reject) => {
		    plus.sqlite.executeSql({
				name: this.dbName,
				sql: `DROP TABLE IF EXISTS ${dbTable}`,
				success(e) {
					resolve(e);
				},
				fail(e) {
					reject(e);
				}
		    })
		})
    },
	/**
	  * @Description: 根据条件向表里插入数据、更新或覆盖
	  *  根据条件向表格里添加数据  有数据更新、无数据插入
	  * (建表时需要设置主键) 例如 --- "roomid" varchar(50) PRIMARY KEY
	  */
    insertOrReplaceData(dbTable, data, condition) {
		// 判断有没有传参
		if (dbTable !== undefined && data !== undefined) {
			if (condition == undefined) var sql = `INSERT OR REPLACE INTO ${dbTable} VALUES('${data}')`;
			else var sql = `INSERT OR REPLACE INTO ${dbTable} (${condition}) VALUES(${data})`;
			return new Promise((resolve, reject) => {
			    // 表格添加数据
			    plus.sqlite.executeSql({
					name: this.dbName,
					sql: sql,
					success(e) {
						resolve(e);
					},
					fail(e) {
						reject(e);
					}
			    })
		    })
		} else {
		    return new Promise((resolve, reject) => { reject("错误添加") })
		}
    },
	/**
	  * @Description: 表里查询数据
	  * 查询获取数据库里的数据 sql:'SELECT * FROM dbTable WHERE lname = 'lvalue''
	  * 查询 SELECT * FROM 、 dbTable 是表名、 WHERE 查找条件 lname,lvalue 是查询条件的列名和列值
	  */ 
    selectTableData(dbTable, lname, lvalue, cc, dd) {
		if (dbTable !== undefined) {
			let sql;
		    // 第一个是表单名称，后两个参数是列表名，用来检索
		    // 两个检索条件
		    if (lname !== undefined && cc !== undefined) sql=`SELECT * FROM ${dbTable} WHERE ${lname} = '${lvalue}' AND ${cc} = '${dd}'`;
			// 一个检索条件
		    if (lname !== undefined && cc == undefined) sql = `SELECT * FROM ${dbTable} WHERE ${lname} = '${lvalue}'`;
		    if (lname == undefined) sql = `SELECT * FROM ${dbTable}`;
		    return new Promise((resolve, reject) => {
				// 表格查询数据  执行查询的SQL语句
				plus.sqlite.selectSql({
				    name: this.dbName,
				    sql: sql,
				    success(e) {
					    resolve(e);
				    },
				    fail(e) {
					    reject(e);
				    }
				})
		    })
		} else {
		  return new Promise((resolve, reject) => { reject("错误查询") });
		}
    },
	/**
	  * @Description: 表里查询数据
	  */ 
	selectTableDataBySql(sql) {
		// console.log(sql)
		if (sql !== undefined) {
		    return new Promise((resolve, reject) => {
				// 表格查询数据  执行查询的SQL语句
				plus.sqlite.selectSql({
				    name: this.dbName,
				    sql: sql,
				    success(e) {
					    resolve(e);
				    },
				    fail(e) {
						console.log(e)
					    reject(e);
				    }
				})
		    })
		} else {
		  return new Promise((resolve, reject) => { reject("错误查询") });
		}
	},
    /**
      * @Description: 表里删除数据
      * 删除表里的数据 sql:'DELETE FROM dbTable WHERE lname = 'lvalue''
      * 删除 DELETE FROM 、 dbTable 是表名、 WHERE 查找条件 lname,lvalue 是查询条件的列名和列值
      */
    deleteTableData(dbTable, lname, lvalue, ww, ee) {
		if(dbTable !== undefined){
			let sql;
		    if(lname == undefined){
			    sql = `DELETE FROM ${dbTable}`;
		    }else{
				if (ww !== undefined) {
				  // 两个检索条件
				  sql = `DELETE FROM ${dbTable} WHERE ${lname} = '${lvalue}' AND ${ww} = '${ee}'`;
				} else {
				  // 一个检索条件
				  sql = `DELETE FROM ${dbTable} WHERE ${lname} = '${lvalue}'`;
				}
		    }
			return new Promise((resolve, reject) => {
				// 删除表数据
				plus.sqlite.executeSql({
					name: this.dbName,
					sql: sql,
					success(e) {
						resolve(e);
					},
					fail(e) {
						reject(e);
					}
				})
			})
		} else {
		  return new Promise((resolve, reject) => { reject("错误删除") });
		}
    },
    /**
      * @Description: 表里修改数据
      * 修改数据表里的数据 sql:"UPDATE dbTable SET 列名 = '列值',列名 = '列值' WHERE lname = 'lvalue'"
      * 修改 UPDATE 、 dbTable 是表名, data: 要修改的列名=修改后列值, lname,lvalue 是查询条件的列名和列值
      */
    updateTableData(dbTable, data, lname, lvalue) {
		let sql;
		if (lname == undefined) sql = `UPDATE ${dbTable} SET ${data}`;
		else sql = `UPDATE ${dbTable} SET ${data} WHERE ${lname} = ${lvalue}`;
		// WHERE 前面是要修改的列名、列值，后面是条件的列名、列值
		return new Promise((resolve, reject) => {
		  // 修改表数据
		    plus.sqlite.executeSql({
				name: this.dbName,
				sql: sql,
				success(e) {
				  resolve(e);
				},
				fail(e) {
				  reject(e);
				}
		    })
		})
    },
	/**
	  * @Description: 获取指定数据条数
	  * 获取指定数据条数  sql:"SELECT * FROM dbTable ORDER BY 'id' DESC LIMIT 15 OFFSET 'num'"
	  * dbTable 表名, ORDER BY 代表排序默认正序, id 是排序的条件 DESC 代表倒序，从最后一条数据开始拿
	  * LIMIT 15 OFFSET '${num}',这句的意思是跳过 num 条拿 15 条数据, num 为跳过多少条数据是动态值
	  * 例 初始num设为0，就从最后的数据开始拿15条，下次不拿刚获取的数据，所以可以让num为15，这样就能一步一步的拿完所有的数据
	  */
	pullSQL(dbTable, id, num) {
		return new Promise((resolve, reject) => {
		    plus.sqlite.selectSql({
				name: this.dbName,
				sql: `SELECT * FROM ${dbTable} ORDER BY '${id}' DESC LIMIT 15 OFFSET '${num}'`,
				success(e) {
				  resolve(e);
				},
				fail(e) {
				  reject(e);
				}
		    })
		})
    },
    /**
    	* @Description: 关闭数据库
    	*/
    close() {
		return new Promise((resolve, reject) => {
			plus.sqlite.closeDatabase({
				name: this.dbName,
				success(e) {
					resolve(e);
				},
				fail(e) {
					reject(e);
				}
			})
		})
    },
}

export default  db;