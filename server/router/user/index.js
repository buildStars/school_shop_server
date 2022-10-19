const express = require('express')
// 生成ID
const {
    v4: uuidv4
} = require('uuid')
// 引入jwt token工具
const JwtUtil = require('../../utils/jwt');
const db = require('../../config/db.js')
const router = express.Router()
router.post('/register', function (req, res) {
    let id = uuidv4() || Math.random().toString().slice(2);
    let userName = req.body.userName; // 用户名
    let passWord = req.body.passWord; // 密码
    let email = req.body.email; //  邮箱
    let phone = req.body.phone; //  手机号
    let v1 = req.body.v1;
    let time = req.body.time || '2022-09-29 00:00:00'; //  用户创建的时间
    // 注册逻辑
    const register = () => {
        // 查询用户表
        let user_check_sql = 'select * from user where email="' + email + '" or phone = "' + phone + '"';
        db.query(user_check_sql, (err, rows) => {
            if (err) {
                res.send({
                    code: -1,
                    msg: '查询失败'
                })
            } else {
                // 解构赋值(数据库)
                if (rows && rows.length != 0) {
                    let [user] = rows;
                    if (user.email == email || user.phone == phone) {
                        res.send({
                            code: 201,
                            msg: '用户已存在'
                        })
                    } else {
                        res.send({
                            code: 501,
                            msg: '后端异常'
                        })
                    }
                } else {
                    // 添加用户
                    let user_insert_sql = 'insert into user (userName,passWord,id,email,phone,time) values (?,?,?,?,?,?)';
                    let params = [userName, passWord, id, email, phone, time]
                    db.query(user_insert_sql, params, (err) => {
                        if (err) {
                            res.send({
                                code: -1,
                                msg: '注册失败'
                            })
                        } else {
                            res.send({
                                code: 200,
                                msg: '注册成功',
                                userName: userName
                            });
                        }
                    })
                }
            }
        })
    }
    if (v1) {
        let code_check_sql = 'select * from code where v1 = "' + v1 + '"'
        db.query(code_check_sql, (err, rows) => {
            if (err) {
                res.send({
                    code: -1,
                    msg: '服务异常'
                })
            } else {
                if (rows && rows.length != 0) {
                    let arr = [...rows].filter(item => {
                        if (item.v1 == v1) {
                            return item;
                        }
                    })
                    if (arr.length == 1) {
                        let code_check_sql2 = 'select * from code where v1 = "' + v1 + '" and cid = "' + arr[0].cid + '"';
                        db.query(code_check_sql2, (err, rows) => {
                            if (err) {
                                res.send({
                                    code: -1,
                                    msg: '邮箱验证失败'
                                })
                            } else {
                                // 验证通过 , 再注册
                                register();
                            }
                        })
                    } else {
                        res.send({
                            code: -1,
                            msg: '验证码冲突了，请重新发送'
                        })
                    }
                } else {
                    res.send({
                        code: 200,
                        msg: '验证码错误'
                    })
                }
            }
        })
    } else {
        res.send({
            code: 404,
            msg: '请发送邮箱验证码'
        })
    }
})
// 查询数据(登录)
router.post('/login', function (req, res) {
    // let userName = req.body.userName;
    let passWord = req.body.passWord;
    let email = req.body.email;
    let phone = req.body.email;
    // 查询用户表
    let user_check_sql = 'select * from user where passWord="' + passWord + '" and email="' + email + '" or phone = "' + phone + '"';
    db.query(user_check_sql, (err, rows) => {
        if (err) {
            res.send({
                code: -1,
                msg: '登录失败'
            })
        } else {
            if (rows && rows.length == 0) {
                res.send({
                    code: 404,
                    msg: '账号或密码错误'
                });
            } else {
                let [{
                    id,
                    userName,
                    email,
                    phone
                }] = rows;
                // 将用户id传入并生成token
                let jwt = new JwtUtil(id);
                // 获取token
                let token = jwt.generateToken();
                // 将 token 返回给客户端
                res.send({
                    code: 200,
                    msg: '登录成功',
                    token,
                    userName,
                    email,
                    phone
                });

            }
            
        }
    })
})

router.get('/shop', function (req, res) {

    let order_by = req.query.order_by || 1;
    let orderStr = '';
    switch (order_by) {
        case "1":
            orderStr = `ORDER BY rand()`
            break;
        case "2":
            orderStr = `ORDER BY recent_order_num`
            break;
        case "3":
            orderStr = `ORDER BY rating`
            break;
        default:
            orderStr = `ORDER BY rand()`
            break;
    }
    // 接收前端传递的用户ID
    // console.log('xxx',id)
    // 查询语句
    let sql = `select * from shop_photo ${orderStr} desc`;
    // 调用查询方法
    db.query(sql, function (err, rows) {
        if (err) {
            res.send({
                code: -1,
                msg: '查询失败'
            })
        } else {
            res.send({
                code: 200,
                result: rows
            });
        }
    });
})
router.get('/search', function (req, res) {
    let searchtext = req.query.searchtext
    // 接收前端传递的用户ID
    // console.log('xxx',id)
    // 查询语句
    let sql = `select * from shop_photo where name like '%${searchtext}%'`;
    // 调用查询方法
    db.query(sql, function (err, rows) {
        if (err) {
            res.send({
                code: -1,
                msg: '查询失败'
            })
        } else {
            res.send({
                code: 200,
                result: rows
            });
        }
    });
})
router.get('/shopDetail', function (req, res) {
    let id = req.query.id
    // 接收前端传递的用户ID
    // console.log('xxx',id)
    // 查询语句
    let sql = 'select * from shop_photo where  id = "' + id + '"';
    // 调用查询方法

    db.query(sql, function (err, rows) {
        if (err) {
            res.send({
                code: -1,
                msg: '查询失败'
            })
        } else {
            res.send({
                code: 200,
                result: rows
            });
        }
    });
})
router.post('/shoppingCart', async function (req, res) {
    let jwt = new JwtUtil(req.body.token);
    let result = jwt.verifyToken();
    let user_id = jwt.verifyToken().data
    // 接收前端传递的用户ID
    // console.log('xxx',id)
    // 查询语句
    if (result == 'err') {
        res.send({
            code: -1,
            msg: '登录已过期,请重新登录'
        });
    } else {
        let sql1 = 'select * from shoppingcart where  food_id =? and user_id=?'
        let p = [req.body.food_id, user_id]
        let res2 = []
        await db.query(sql1, p, async function (err, rows) {
            if (err) {
                res.send({
                    code: -1,
                    msg: '查询失败'
                })
            } else {
                res2 = rows
                if (res2.length < 1) {
                    let sql = 'insert into shoppingcart (food_id,price,name,count,shop_id,img_url,user_id) values(?,?,?,?,?,?,?)';
                    p = [req.body.food_id, req.body.price, req.body.name, req.body.count, req.body.shop_id, req.body.img_url, user_id]
                    // 调用查询方法

                    db.query(sql, p, function (err, rows) {
                        if (err) {
                            res.send({
                                code: -1,
                                msg: '查询失败'
                            })
                        } else {
                            res.send({
                                code: 200,
                                result: rows
                            });
                        }
                    });
                } else {
                    let sql2 = 'update shoppingcart set count=? where id=?';
                    p = [+req.body.count + res2[0].count, res2[0].id]
                    db.query(sql2, p, function (err, rows) {
                        if (err) {
                            res.send({
                                code: -1,
                                msg: '查询失败'
                            })
                        }
                    });
                    res.send({
                        code: 200,
                        msg: 'cnm'
                    })
                }
            }
        });
    }




})
router.get('/shopping', function (req, res) {
    let jwt = new JwtUtil(req.query.token);
    let id = req.query.id;
    let result = jwt.verifyToken();
    let user_id = jwt.verifyToken().data

    // 接收前端传递的用户ID
    // console.log('xxx',id)
    // 查询语句
    let sql = 'select * from shoppingcart where  shop_id = "' + id + '"';
    // 调用查询方法

    db.query(sql, function (err, rows) {
        if (err) {
            res.send({
                code: -1,
                msg: '查询失败'
            })
        } else {
            res.send({
                code: 200,
                result: rows
            });
        }
    });
})
router.get('/my', function (req, res) {
    let jwt = new JwtUtil(req.query.token);
    let result = jwt.verifyToken();
    let user_id = jwt.verifyToken().data

    // 接收前端传递的用户ID
    // console.log('xxx',id)
    // 查询语句
    let sql = 'select * from user where  id = "' + user_id + '"';
    // 调用查询方法
    if (result == 'err') {
        res.send({
            code: -1,
            msg: '登录已过期,请重新登录'
        });
    } else {
        db.query(sql, function (err, rows) {
            if (err) {
                res.send({
                    code: -1,
                    msg: '查询失败'
                })
            } else {
                res.send({
                    code: 200,
                    result: rows
                });
            }
        });
    }

})
router.get('/minus', async function (req, res) {
    // 接收前端传递的用户ID
    // 查询语句
    let sql1 = 'select * from shoppingcart where id=? '
    let p = [req.query.id]
    let res2 = []
    await db.query(sql1, p, async function (err, rows) {
        if (err) {
            res.send({
                code: -1,
                msg: '查询失败'
            })
        } else {
            res2 = rows
            let sql2 = 'update shoppingcart set count=? where id=?';
            let result = res2[0].count - req.query.count
            if (result == 0) {
                let sql3 = 'delete from shoppingcart where id=?';
                let a = [req.query.id]
                db.query(sql3, a, function (err, rows) {
                    if (err) {
                        res.send({
                            code: -1,
                            msg: '查询失败'
                        })
                    } else {
                        res.send({
                            code: '000'
                        })
                    }
                });
            } else {
                p = [result, res2[0].id]
                db.query(sql2, p, function (err, rows) {
                    if (err) {
                        res.send({
                            code: -1,
                            msg: '查询失败'

                        })
                    } else {
                        res.send({
                            rows,
                            code: 200,
                        })
                    }
                });

            }

        }

    });



})
router.get('/add', async function (req, res) {
    // 接收前端传递的用户ID
    // 查询语句
    let sql1 = 'select * from shoppingcart where id=? '
    let p = [req.query.id]
    let res2 = []
    await db.query(sql1, p, async function (err, rows) {
        if (err) {
            res.send({
                code: -1,
                msg: '查询失败'
            })
        } else {
            res2 = rows
            let sql2 = 'update shoppingcart set count=? where id=?';
            let result = +req.query.count + res2[0].count
            p = [result, res2[0].id]
            db.query(sql2, p, function (err, rows) {
                if (err) {
                    res.send({
                        code: -1,
                        msg: '查询失败'

                    })
                } else {
                    res.send({
                        result: rows,
                        code: 200,
                    })
                }

            });

        }

    });
})
router.get('/remove', async function (req, res) {
    // 接收前端传递的用户ID
    // 查询语句
    let sql = 'delete from shoppingcart where shop_id=?'
    let p = [req.query.id]
    await db.query(sql, p, async function (err, rows) {
        if (err) {
            res.send({
                code: -1,
                msg: '删除失败'
            })
        } else {
            res.send({
                code: 200,
                msg: '删除成功',
            })
        }

    });



})
router.post('/order', async function (req, res) {
    let jwt = new JwtUtil(req.body.token);
    let result = jwt.verifyToken();
    let user_id = jwt.verifyToken().data
    // 接收前端传递的用户ID
    // console.log('xxx',id)
    // 查询语句
    if (result == 'err') {
        res.send({
            code: -1,
            msg: '登录已过期,请重新登录'
        });
    } else {
        let sql1 = 'select * from order_list where user_id=?'
        let p = [user_id]
        let res2 = []

        let addTime = new Date().toLocaleString()
        await db.query(sql1, p, async function (err, rows) {
            if (err) {
                res.send({
                    code: -2,
                    msg: '查询失败'
                })
            } else {
                let res3 = rows.map(row =>{
                
                      row.info = JSON.parse(row.info)
                
                    return row
                })
                res.send({
                    code: 200,
                    result: rows
                })
                if (req.body.name != null) {
                    let sql = 'insert into order_list (user_id,info,name,shop_id,is_finish,addtime,order_price,allcount) values(?,?,?,?,?,?,?,?)';
                    p = [user_id, req.body.info, req.body.name, req.body.shop_id,"已完成",addTime, req.body.total,req.body.allcount]
                    // 调用查询方法

                    db.query(sql, p, function (err, rows) {
                        if (err) {
                            res.send({
                                code: -1,
                                msg: '查询失败'
                            })
                        }
                    });
                }
            }

        });
    }




})
// 清空购物车
router.get('/clear', async function (req, res) {
    // 接收前端传递的用户ID
    // 查询语句
    let jwt = new JwtUtil(req.query.token);
    let user_id = jwt.verifyToken().data
    let sql = 'delete from shoppingcart where  shop_id =? and user_id=?'
    let p = [req.query.id,user_id]
   
    
   
    await db.query(sql, p, async function (err, rows) {
        if (err) {
            res.send({
                code: -1,
                msg: '删除失败'
            })
        } else {
            res.send({
                code: 200,
                msg: '删除成功',
            })
        }
        });
    });
    // 增加地址
    router.post('/addAddress', async function (req, res) {
        // 接收前端传递的用户ID
        // 查询语句
        let jwt = new JwtUtil(req.body.token);
        let user_id = jwt.verifyToken().data
        let sql = 'insert into address (name,tel,address,user_id,email_id,is_defalut) values(?,?,?,?,?,?)';
        let p = [ req.body.name, req.body.phone,req.body.address,user_id,req.body.email_id,req.body.is_default]
        // 调用查询方法
        await db.query(sql, p, async function (err, rows) {
            if (err) {
                res.send({
                    code: -1,
                    msg: '添加失败'
                })
            } else {
                res.send({
                    code: 200,
                    msg: '添加成功',
                })
            }
        });
    })
    // 获取地址
    router.get('/getAddress', async function (req, res) {
        // 接收前端传递的用户ID
        // 查询语句
        let jwt = new JwtUtil(req.query.token);
        let user_id = jwt.verifyToken().data
        let sql = 'select * from address where user_id=?'
        let p = [user_id]
        // 调用查询方法
        await db.query(sql, p, async function (err, rows) {
            if (err) {
                res.send({
                    code: -1,
                    msg: '查询失败'
                })
            } else {
                res.send({
                    code: 200,
                    result: rows
                })
            }
        });
    })
    //编辑地址
    router.post('/editAddress', async function (req, res) {
        // 接收前端传递的用户ID
        // 查询语句
        let jwt = new JwtUtil(req.body.token);
        let user_id = jwt.verifyToken().data
        let sql = 'update address set name=?,tel=?,address=?,email_id=?,is_defalut=? where user_id=?'
        let p = [req.body.name, req.body.phone, req.body.address, req.body.email_id, req.body.is_default,user_id]
        // 调用查询方法
        await db.query(sql, p, async function (err, rows) {
            if (err) {
                res.send({
                    code: -1,
                    msg: '编辑失败'
                })
            } else {
                res.send({
                    code: 200,
                    msg: '编辑成功',
                })
            }
        });
    })
    // 删除地址
    router.get('/delAddress', async function (req, res) {
        // 接收前端传递的用户ID
        // 查询语句
   
        let sql = 'delete from address where address_id =?'
         let p = [req.query.id]
        await db.query(sql, p, async function (err, rows) {
            if (err) {
                res.send({
                    code: -1,
                    msg: '删除失败'
                })
            } else {
                res.send({
                    code: 200,
                    msg: '删除成功',
                })
            }
        });
        });
        // 通过地址id获取地址
        router.get('/getAddressById', async function (req, res) {
            // 接收前端传递的用户ID
            // 查询语句
            let jwt = new JwtUtil(req.query.token);
            let user_id = jwt.verifyToken().data
            let sql = 'select * from address where user_id=? and address_id=?'
            let p = [user_id,req.query.id]
            // 调用查询方法
            await db.query(sql, p, async function (err, rows) {
                if (err) {
                    res.send({
                        code: -1,
                        msg: '查询失败'
                    })
                } else {
                    res.send({
                        code: 200,
                        result: rows
                    })
                }
            });
        })
     
            
// 更新名字
router.post('/updateName', async function (req, res) {
    // 接收前端传递的用户ID
    // 查询语句
    let jwt = new JwtUtil(req.body.token);
    let user_id = jwt.verifyToken().data
    let sql = 'update user set userName=? where id=?'
    let p = [req.body.name, user_id]
    // 调用查询方法
    await db.query(sql, p, async function (err, rows) {
        if (err) {
            res.send({
                code: -1,
                msg: '更新失败'
            })
        } else {
            res.send({
                code: 200,
                msg: '更新成功',
            })
        }
    });
})
// 删除订单
router.get('/delOrder', async function (req, res) {
    // 接收前端传递的用户ID
    let jwt = new JwtUtil(req.query.token);
    let user_id = jwt.verifyToken().data
    // 查询语句
    let sql = 'delete from order_list where order_id =? and user_id=?'
     let p = [req.query.id,user_id]
    // 调用查询方法
    await db.query(sql, p, async function (err, rows) {
        if (err) {
            res.send({
                code: -2,
                msg: '删除失败'
            })
        } else {
            res.send({
                code: 200,
                msg: '删除成功'
            })
        }
    });
})

// 增加收藏
router.post('/addCollect', async function (req, res) {
    // 查询语句
    // 接收前端传递的用户ID
    let jwt = new JwtUtil(req.body.token);
    let user_id = jwt.verifyToken().data
    let sql1='select * from collect where user_id=? and shop_id=?'
    let p1=[user_id,req.body.shop_id]
    await db.query(sql1, p1, async function (err, rows) {
        if (err) {
            res.send({
                code: -1,
                msg: '查询失败'
            })
        } else {
            if(rows.length>0){
                res.send({
                    code: -2,
                    msg: '已收藏'
                })
            }else{
                let sql = 'insert into collect (user_id,shop_id,shop_name,rating,url,float_minimum_order_amount,float_delivery_fee,recent_order_num) values(?,?,?,?,?,?,?,?)'
                let p = [user_id, req.body.shop_id, req.body.shop_name, req.body.rating, req.body.url, req.body.float_minimum_order_amount, req.body.float_delivery_fee, req.body.recent_order_num]
                // 调用查询方法
                await db.query(sql, p, async function (err, rows) {
                    if (err) {
                        res.send({
                            code: -1,
                            msg: '收藏失败'
                        })
                    } else {
                        res.send({
                            code: 200,
                            msg: '收藏成功'
                        })
                    }
                });
            }
    // 查询语句
        }
    });
})
// 获取收藏
router.get('/getCollect', async function (req, res) {
    // 接收前端传递的用户ID
    let jwt = new JwtUtil(req.query.token);
    let user_id = jwt.verifyToken().data
    // 查询语句
    let sql = 'select * from collect where user_id=?'
    let p = [user_id]
    // 调用查询方法
    await db.query(sql, p, async function (err, rows) {
        if (err) {
            res.send({
                code: -1,
                msg: '查询失败'
            })
        } else {
            res.send({
                code: 200,
                result: rows
            })
        }
    });
})
// 删除收藏
router.get('/delCollect', async function (req, res) {
    // 接收前端传递的用户ID
    let jwt = new JwtUtil(req.query.token);
    let user_id = jwt.verifyToken().data
    // 查询语句
    let sql = 'delete from collect where user_id=? and shop_id=?'
    let p = [user_id, req.query.shop_id]
    // 调用查询方法
    await db.query(sql, p, async function (err, rows) {
        if (err) {
            res.send({
                code: -1,
                msg: '删除失败'
            })
        } else {
            res.send({
                code: 200,
                msg: '删除成功'
            })
        }
    });
})
// 查询指定收藏
router.get('/getCollectById', async function (req, res) {
    // 接收前端传递的用户ID
    let jwt = new JwtUtil(req.query.token);
    let user_id = jwt.verifyToken().data
    // 查询语句
    let sql = 'select * from collect where user_id=? and shop_id=?'
    let p = [user_id, req.query.shop_id]
    // 调用查询方法
    await db.query(sql, p, async function (err, rows) {
        if (err) {
            res.send({
                code: -1,
                msg: '查询失败'
            })
        } else {
            res.send({
                code: 200,
                result: rows
            })
        }
    });
})
// 指定服务器对象监听的端口号

           
module.exports = router;