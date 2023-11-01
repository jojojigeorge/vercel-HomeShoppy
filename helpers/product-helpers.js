var db=require('../config/connection')
var collection = require('../config/collection')
const { response } = require('express')
var objectId = require('mongodb').ObjectId
const bcrypt = require('bcrypt')


module.exports={
    shipped:(orderId)=>{
        return new Promise(async(resolve, reject) => {
            await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                {
                    $set: { status: 'shipped' }
                })
                resolve()
        })

    },
    getAddress:(orderId)=>{
        return new Promise(async(resolve, reject) => {
            let add = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId)}
                },
                {
                    $project:{
                        deliveryDetails:1,
                        date:1,
                        paymentMethod:1
                    }
                }
            ]).toArray()
            console.log("Address",add);
            resolve(add)
        })
    },
    // getProductAdminDetails: (orderId,userId) => {
    //     return new Promise(async (resolve, reject) => {
    //         let order = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
    //             {
    //                 $match: { _id: objectId(orderId)}
    //             },
    //             // {
    //             //     $project: {
    //             //        products: {
    //             //         $filter: {
    //             //             input: "$products",
    //             //             as: "products",
    //             //             cond: { $eq: [ "$$products._id", objectId(prodId) ] }
    //             //          }
    //             //        }
    //             //     }
    //             //  },
    //             // {$elemMatch:{products:objectId(prodId)}},
    //             {
    //                 $unwind: '$products'
    //             },
    //             {
    //                 $project: {
    //                     deliveryDetails:1,
    //                     paymentMethod:1,
    //                     status:1,
    //                     date:1,
    //                     totalPrice:1,
    //                     item: '$products.item',
    //                     quantity: '$products.quantity',
    //                 }
    //             },
    //             {
    //                 $lookup: {
    //                     from: 'product',
    //                     localField: 'item',
    //                     foreignField: '_id',
    //                     as: 'prod'
    //                 }
    //             },
    //             {
    //                 $project: {
    //                     deliveryDetails:1,
    //                     paymentMethod:1,
    //                     status:1,
    //                     date:1,
    //                     totalPrice:1,
    //                     item: 1,
    //                     quantity: 1,
    //                     product: { $arrayElemAt: ['$prod', 0] }
    //                 }
    //             },
    //             // {
    //             //     $match: { item: objectId(prodId)}
    //             // },
                
               
    //         ]).toArray()
    //         console.log('--------prooooooducts');

    //         console.log(order);
    //         resolve(order)
    //     })
    // },
    getProductAdminDetails: (orderId,sellerId) => {
        orderId=objectId(orderId)
        sellerId=objectId(sellerId)
        return new Promise(async (resolve, reject) => {
            let order = await db
				.get()
				.collection(collection.ORDER_COLLECTION)
				.aggregate([
					{
						$unwind: "$products",
					},
					{
						$project: {
							paymentMethod: 1,
							status: 1,
							date: 1,
							userId: 1,
							products: 1,
							// totalPrice: 1,
							// prod: '$products.item',
							sellerId: "$products.adminId",
							// adminId:1
						},
					},
					{
						$match: { sellerId: sellerId },
					},

					{ $group: { _id: { _id: "$_id", userId: "$userId" }, orderItems: { $push: "$products" } } },
					// {
					//     $project:{
					//         orderId:'$_id._id',
					//         userId:'$_id.userId',
					//         // quantity:'$_id.quantity',
					//         orderItems:1
					//     }
					// },
					{
						//FOR PRODUCT DETAILS
						$lookup: {
							from: "product",
							localField: "orderItems.item",
							foreignField: "_id",
							as: "pdetails",
						},
					},
					{
						$project: {
							orderItems: {
								$map: {
									input: "$pdetails",
									in: {
										$let: {
											vars: {
												m: {
													$arrayElemAt: [
														{
															$filter: {
																input: "$orderItems",
																cond: {
																	$eq: [
																		"$$mb.item",
																		"$$this._id",
																	],
																},
																as: "mb",
															},
														},
														0,
													],
												},
											},
											in: {
												$mergeObjects: [
													"$$this",
													{
														qtyOrder: "$$m.quantity",
													},
												],
											},
										},
									},
								},
							},
						},
					},
					// {
					//     $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$pdetails", 0 ] }, "$$ROOT" ] } }
					//  },
					//  { $project: { proDetails: { $arrayElemAt: ['$pdetails'] }, } }
					// {
					//     $project:{
					//         _id:0,
					//         orderId:1,
					//         userId:1,
					//         orderItems:1
					//         // address: { $arrayElemAt: ['$address', 0] }

					//     }
					// },
					// {//FOR ADDRESS
					//     $lookup: {
					//         from: 'order',
					//         localField: 'orderId',
					//         foreignField: '_id',
					//         as: 'address'
					//     }
					// },
					// {
					//     $project:{
					//         _id:0,
					//         orderId:1,
					//         userId:1,
					//         orderItems:{ $arrayElemAt: ['$orderItems', 0] },
					//         address: { $arrayElemAt: ['$address', 0] }

					//     }
					// },
				])
				.toArray();
            // console.log(order);
            // console.log('--------orderItems in \n',order[0]);

            resolve(order[0])
        })
    },
    // getOrderList: () => {
    //     return new Promise(async (resolve, reject) => {
    //         let order = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                
    //             {
    //                 $project: {
    //                     paymentMethod: 1,
    //                     status: 1,
    //                     date: 1,
    //                     userId: 1,
    //                     totalPrice: 1,
    //                     adminId:1
    //                 }
    //             }
    //         ]).toArray()
    //         console.log('adminId in admin orderdetails',order);
    //         resolve(order)
    //     })
    // },
    // getOrderList: (seller) => {
    //     return new Promise(async (resolve, reject) => {
    //         let order = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                
               
    //                 // {$match: {'products.adminId': seller}},
    //                 {$project: {
    //                     products: {$filter: {
    //                         input: '$products',
    //                         as: 'products',
    //                         cond: {$eq: ['$$products.adminId', seller]}
    //                     }},
    //                     paymentMethod: 1,
    //                     status: 1,
    //                     date: 1,
    //                     userId: 1,
    //                     totalPrice: 1,
    //                     adminId:1,
    //                      prod: '$products.item',
    //                     prodcts:1

    //                 }},
    //                 // {$project: {products: {item:1}}}
                    
    //             // {
    //             //     $match: { sellerId: seller }
    //             // },
    //         ]).toArray()
             
    //         console.log('product helper/getOrderList adminId in admin order details',order);
    //         resolve(order)
    //     })
    // },
    getOrderList: (seller) => {
        let sellId=objectId(seller)
        return new Promise(async (resolve, reject) => {
            let order = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        paymentMethod: 1,
                        status: 1,
                        date: 1,
                        userId: 1,
                        products:1,
                        // totalPrice: 1,
                        // prod: '$products.item',
                        sellerId: '$products.adminId',
                        // adminId:1
                    }
                },
                {
                    $match: { sellerId: sellId }
                },
                
                { $group: { _id: { '_id': "$_id", userId: "$userId" } , orderItems: { $push: "$products" }} },
                {
                    $project:{
                        orderId:'$_id._id',
                        userId:'$_id.userId',
                        orderItems:1
                    }
                },
                {
                    $lookup: {
                        from: 'order',
                        localField: 'orderId',
                        foreignField: '_id',
                        as: 'address'
                    }
                },
                {
                    $project:{
                        _id:0,
                        orderId:1,
                        userId:1,
                        orderItems:1,
                        address: { $arrayElemAt: ['$address', 0] }

                    }
                },
                
                // { $limit : 1 }
                // { $group: { _id: "$userId", mergedSales: { $mergeObjects: "$products" } } }
            ]).toArray()
            // console.log('adminId in admin order details',order);
            resolve(order)
        })
    },
    doAdminLogin: (adminData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ username: adminData.username })
            if (admin) {
                bcrypt.compare(adminData.password, admin.password).then((status) => {
                    if (status) {
                        console.log('login success');
                        response.admin = admin
                        response.status = true
                        resolve(response)
                    } else {
                        loginErr = 'admin exist but wrong password'
                        console.log('admin exist but wrong password');
                        resolve({ status: false ,loginErr:loginErr})
                    }
                })
            } else {
                console.log('admin not exist');
                loginErr = 'admin not exist'

                resolve({ status: false ,loginErr:loginErr})
            }
        })
    },
    doAdminSignup: (admindata) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            try {
                admindata.password = await bcrypt.hash(admindata.password, 10)
                db.get().collection(collection.ADMIN_COLLECTION).insertOne(admindata).then((data) => {
                    console.log(data);
                    response.admin =admindata
                    resolve(response)
                })
            } catch (err) {
                next(err)
            }
        })
    },
    addProduct:(product,callback)=>{
    db.get().collection('product').insertOne(product).then((data)=>{
        db.get().collection(collection.PRODUCT_COLLECTIONS).updateOne({
            _id: product._id, stock: { $type: 2 }
        },
            [{ $set: { stock: { $toInt: "$stock" } } }]
        )
        callback(data.insertedId)
    })
    },
    getAllProducts:(adminId)=>{
        return new Promise(async(resolve, reject) => {
            let products =await db.get().collection(collection.PRODUCT_COLLECTIONS).find({ adminId: adminId }).toArray()
            resolve(products)
        })
    },
    
    getSameCategoryProducts:(cat)=>{
        return new Promise(async(resolve, reject) => {
            let products =await db.get().collection(collection.PRODUCT_COLLECTIONS).find({category:cat}).toArray()
            // console.log('IIIIIIIIIIIIIIIIII',products);
            resolve(products)
        })
    },
    deleteProduct:(proId)=>{
        return new Promise((resolve, reject) => {
            // console.log(objectId(proId));
            db.get().collection(collection.PRODUCT_COLLECTIONS).deleteOne({_id:objectId(proId) }).then((response)=>{
                // console.log(response);
                resolve(response)
            })
        })
    },
    getProdctDetails:(prodId)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTIONS).findOne({_id:objectId(prodId)}).then((product)=>{
                // console.log(product);
                
                resolve(product)
            })
        })
    },
    updateProduct:(proId,proDetails)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTIONS).updateOne({_id:objectId(proId)},{
                $set:{
                    category:proDetails.category,
                    title:proDetails.title,
                    slug:proDetails.slug,
                    tag:proDetails.tag,
                    smalldescription:proDetails.smalldescription,
                    stock:parseInt(proDetails.stock),
                    sellprice:proDetails.sellprice,
                    available:proDetails.available,
                    trending:proDetails.trending,
                    metakey:proDetails.metakey,
                    description:proDetails.description,
                    price:proDetails.price,
                }
            }).then((response)=>{
                // console.log('stocksssss',)
                resolve()
            })
        })
    },


    addCategory:(category,callback)=>{
        db.get().collection(collection.CATEGORY_COLLECTION).insertOne(category).then((data)=>{
            console.log(data.insertedId.toString() )
            callback(data.insertedId)
        })
    },



    getAllCategories:(adminId)=>{
        return new Promise(async(resolve, reject) => {
            let cat =await db.get().collection(collection.CATEGORY_COLLECTION).find({ adminId: adminId }).toArray()
            resolve(cat)
        })
    },
    // ADD A NEW FIELD TO DATABASE
    // getAllCategories:(adminId)=>{
    //     return new Promise(async(resolve, reject) => {
    //         db.get().collection(collection.CATEGORY_COLLECTION).aggregate( [
    //             {
    //               $addFields: { "adminId": '6411ef817042f801a58c562d' }
    //             }
    //           ] )
    //         // let cat =await db.get().collection(collection.CATEGORY_COLLECTION).find({ adminId: adminId }).toArray()
    //         resolve()
    //     })
    // },
    



    // getAllCategories:(adminId)=>{
    //     return new Promise(async(resolve, reject) => {
    //         db.get().collection(collection.CATEGORY_COLLECTION).updateMany({}, { $set: {'adminId':'6411ef817042f801a58c562d'} });
    //         // db.get().collection(collection.CATEGORY_COLLECTION).updateMany({})},{
    //         //     $set:{
                    
    //         //         adminId:'6411ef817042f801a58c562d'
    //         //     }
    //         // let cat =await db.get().collection(collection.CATEGORY_COLLECTION).find({ adminId: adminId }).toArray()
    //         // resolve(cat)
    //     })
    // },




    deleteCategory:(categoryId)=>{
        return new Promise((resolve, reject) => {
            // console.log(objectId(proId));
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({_id:objectId(categoryId) }).then((response)=>{
                // console.log(response);
                resolve(response)
            })
        })
    },
    getCategoryDetails:(prodId)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:objectId(prodId)}).then((category)=>{
                // console.log(category);
                
                resolve(category)
            })
        })
    },
    updateCategory:(proId,proDetails)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:objectId(proId)},{
                $set:{
                    category:proDetails.category,
                    availableStatus:proDetails.availableStatus,
                    description:proDetails.description,
                    price:proDetails.price,
                    metakey:proDetails.metakey,
                    trending:proDetails.trending,
                }
            }).then((response)=>{
                resolve()
            })
        })
    },
    getAllCategory:(adminId)=>{
        // return new Promise((resolve, reject) => {
        //     db.get().collection(collection.CATEGORY_COLLECTION).
        // })
        return new Promise(async(resolve, reject) => {
            let allCategory = await db.get().collection(collection.CATEGORY_COLLECTION).aggregate([
                {
                    $match: { adminId: adminId}
                },
                {
                    $project:{
                        category:1,
                       
                    }
                }
            ]).toArray()
            // console.log("all category",allCategory);
            resolve(allCategory)
        })
    }
}