var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt')
const { USER_COLLECTION, CART_COLLECTION, ORDER_COLLECTION } = require('../config/collection')
const { response } = require('express')
var objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay');
var instance = new Razorpay({
    key_id: 'rzp_test_Wg7kegePFl1cq5',
    key_secret: 'QhtPGEAr0l8Drug2oyHZsP2t',
})

module.exports = {
    updateAvailableStatus:(prodId)=>{
        return new Promise(async(resolve, reject) => {
            await db.get().collection(collection.PRODUCT_COLLECTIONS).updateOne({ _id: objectId(prodId), stock: { $gt: 0} },
            {
                $set: { 'available': 'true' }
            }).then(()=>{
                resolve()
            })
        })
    },
    changeOrderStatus: (orderId) => {
        // console.log('inside change order status method ', orderId);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                {
                    $set: {
                        status: 'placed'
                    }
                }).then(() => {
                    resolve()
                })
        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto')
            const hmac = crypto.createHmac('sha256', 'QhtPGEAr0l8Drug2oyHZsP2t').update(details['payment[razorpay_order_id]'] + "|" + details['payment[razorpay_payment_id]']).digest('hex');
            if (hmac == details['payment[razorpay_signature]']) {
                console.log('signature matched');
                resolve()
            } else {
                reject()
            }
        })
    },
    addToCartQty: (product, userId) => {
        // console.log('add to cart with qnty', product);
        var qty = parseInt(product.quantity);
        let prodId = product.prodId
        prodObj = {
            item: objectId(product.prodId),
            quantity: qty,
            adminId:product.adminId
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let prodExist = userCart.product.findIndex(product => product.item == prodId)
                if (prodExist != -1) {

                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId), 'product.item': objectId(prodId) },
                        {
                            $inc: { 'product.$.quantity': qty }
                        }).then((response) => {
                            resolve()
                        })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) }, {
                        $push: { product: prodObj }
                    }).then((response) => {
                        resolve()
                    })
                }

            } else {
                let cartObj = {
                    user: objectId(userId),
                    product: [prodObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getAllCategories:()=>{
        return new Promise(async(resolve, reject) => {
            let cat =await db.get().collection(collection.CATEGORY_COLLECTION).find({ }).toArray()
            resolve(cat)
        })
    },
    getSameCategoryProducts: (cat) => {
        return new Promise(async (resolve, reject) => {
            // console.log('cat is ',cat);
            let products = await db.get().collection(collection.PRODUCT_COLLECTIONS).find({ category: cat }).toArray()
            // console.log('getSameCategoryProducts in function',products);
            
            resolve(products)
        })
    },
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            try {
                userData.password = await bcrypt.hash(userData.password, 10)
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                    // console.log(data);
                    response.user = userData
                    resolve(response)
                })
            } catch (err) {
                next(err)
            }
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        console.log('login success');
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log('user exist but wrong password');
                        resolve({ status: false })
                    }
                })
            } else {
                console.log('user not exist');
                resolve({ status: false })
            }
        })
    },
    selectedProductDetails: (prodId) => {
        return new Promise(async (resolve, reject) => {
            let prod = await db.get().collection(collection.PRODUCT_COLLECTIONS).findOne({ _id: objectId(prodId) })

            resolve(prod)
        })
    },
        minusFromStock: (prodId) => {
        return new Promise(async (resolve, reject) => {
            let inStock = null
            let updated=false
            let available=false
            inStock = await db.get().collection(collection.PRODUCT_COLLECTIONS).find({ _id: objectId(prodId), stock: { $gt: 0} }).toArray()
            // console.log('prodddd:', prod);//must erase this
            // db.get().collection(collection.PRODUCT_COLLECTIONS).updateOne({
            //     _id: objectId(prodId), stock: { $type: 2 }
            // },
            //     [{ $set: { stock: { $toInt: "$stock" } } }]
            // )
            // console.log('instock',inStock);
            if (inStock[0]!=null) {
                await db.get().collection(collection.PRODUCT_COLLECTIONS).updateOne({ _id: objectId(prodId), stock: { $gte: 1 } },
                {
                    $inc: { stock: -1 }
                })
                await db.get().collection(collection.PRODUCT_COLLECTIONS).updateOne({ _id: objectId(prodId), stock: { $eq: 0} },
                {
                    $set: { available: false }
                }).then((response) => {
                    // console.log('stock und');
                   updated=true
                })
            } else {
                // resolve(false)
                // db.get().collection(collection.PRODUCT_COLLECTIONS).updateOne({ _id: objectId(prodId), stock: { $eq: 1 } },
                //     {
                //         $inc: { stock: -1 },$set: { available: false }
                //     }).then((response) => {
                //         // console.log('stock thernu');
                //         resolve({instock:false})
                //     })
            }
            product = await db.get().collection(collection.PRODUCT_COLLECTIONS).aggregate([
                {
                    $match: { _id: objectId(prodId) }
                },
                {
                    $project: {
                        available: 1
                    }
                }
            ]).toArray()
            available=product[0].available
            // console.log('updated,available',updated,available)
            resolve({updated:updated,available:available})
        })

    },
    updateStock: (prodId,qty) => {
        qty=parseInt(qty)
        return new Promise(async (resolve, reject) => {
            let availableStock = await db.get().collection(collection.PRODUCT_COLLECTIONS).aggregate([
                {
                    $match: { _id: objectId(prodId) }
                },
                {
                    $project: {
                        stock: 1
                    }
                }
            ]).toArray()
            let inStock = availableStock[0].stock
            // inStock = await db.get().collection(collection.PRODUCT_COLLECTIONS).find({ _id: objectId(prodId), stock: { $gt:1 } }).toArray()
            // console.log('instock value before updation',availableStock[0].stock);
            if (inStock>qty) {
            await db.get().collection(collection.PRODUCT_COLLECTIONS).updateOne({ _id: objectId(prodId), stock: { $gt: qty} },
                {
                    $inc: { stock: -qty }
                })
                // .then((response) => {
                //     // console.log('stock und');
                    // ({instock:true})
                // })
                resolve({status:true})
            }else if(inStock==qty){
                await db.get().collection(collection.PRODUCT_COLLECTIONS).updateOne({ _id: objectId(prodId), stock: { $eq: qty } },
                {
                    $inc: { stock: -qty },$set: { available: false }
                })
                resolve({status:'false'})

            }
    
                // .then((response) => {
                //     // console.log('stock thernu');
                //     ({instock:false})
                // })//resolve(instock)
            
             else {
            // db.get().collection(collection.PRODUCT_COLLECTIONS).updateOne({ _id: objectId(prodId), stock: { $eq: 1} },
            //     {
            //         $set: { available: false }
            //     })
                // .then((response) => {
                    console.log('stock thernu');
                //     resolve()
                // })
                resolve({status:''})
            }
            


            availableStock = await db.get().collection(collection.PRODUCT_COLLECTIONS).aggregate([
                {
                    $match: { _id: objectId(prodId) }
                },
                {
                    $project: {
                        stock: 1
                    }
                }
            ]).toArray()
            // inStock = await db.get().collection(collection.PRODUCT_COLLECTIONS).find({ _id: objectId(prodId), stock: { $gt:1 } }).toArray()
            // console.log('instock value after updation',availableStock[0].stock);


            // let availableStatus = await db.get().collection(collection.PRODUCT_COLLECTIONS).aggregate([
            //         {
            //             $match: { _id: objectId(prodId) }
            //         },
            //         {
            //             $project: {
            //                 available: 1
            //             }
            //         }
            //     ]).toArray()
            //     console.log(availableStatus);
            //     resolve(availableStatus)
        })

    },
    addToCart: (productDetails, userId) => {
        let prodId=productDetails._id.toString()
        // console.log('user-helpers/addToCat\n productDetails',productDetails)
        prodObj = {
            item: objectId(prodId),
            quantity: 1,
            adminId:objectId(productDetails.adminId)
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let prodExist = userCart.product.findIndex(product => product.item == prodId)
                console.log(userCart);
                // console.log(prodExist);
                if (prodExist != -1) {

                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId), 'product.item': objectId(prodId) },
                        {
                            $inc: { 'product.$.quantity': 1 }
                        }).then((response) => {
                            resolve()
                        })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) }, {
                        $push: { product: prodObj }
                    }).then((response) => {
                        resolve()
                    })
                }

            } else {
                let cartObj = {
                    user: objectId(userId),
                    product: [prodObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },

    // addToCart: (productDetails, userId) => {
       
    //     return new Promise(async (resolve, reject) => {
    //         let prodId=productDetails._id.toString()
    //         let sellId=productDetails.adminId.toString()
    //         prodObj = {
    //             item: productDetails._id,
    //             quantity: 1,
                
    //         }
    //         let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
    //         if (userCart) {//USER HAS A CART
    //             // let prodExist = userCart.product.indexOf(check)
    //             // let prodExist = userCart.product.includes(prodId)
    //             // let sellerExist = userCart.seller.findIndex(seller => seller.sellerId == sellId)
    //             let prodExist = userCart.sellers.sellerProds.findIndex(sellerProds => sellerProds.item == prodId)
    //             //  let prodxist = userCart.sellers.sellerId.findIndex(product => product.item == prodId)
    //             let sellerExisit= await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) ,'sellers.sellerId':objectId(sellId)})
    
    //             console.log(sellerExisit);
    //             console.log('prodid',prodId);
    //             // console.log('sellid',sellId); 
    //             console.log('userid',userId);
    //             // console.log('product details',productDetails._id);
    //             console.log('find Index',prodExist);
    //             if(sellerExisit){
    //                 if (prodExist != -1) {//PRODUCT ALREDY EXISIT

    //                     db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId), 'sellers.sellerProds.item': objectId(prodId) },
    //                         {
    //                             $inc: { 'sellers.sellerProds.$.quantity': 1 }
    //                         }).then((response) => {
    //                             resolve()
    //                         })
    //                 } else {//PRODUCT NOT EXISIT
    //                     db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) }, {
    //                         $push: { 'sellers.sellerProds': prodObj }
    //                     }).then((response) => {
    //                         resolve()
    //                     })
    //                 }
    //             }else{
    //                 sellObj={
    //                     sellers: {
    //                         sellerId:objectId(productDetails.adminId),
    //                         sellerProds:[prodObj]
    //                     }
    //                 }
    //                 await db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) }, 
    //                 {
    //                     $push: { 'sellers.sellerProds': prodObj }
    //                 })
                    
    //             }
                

    //         } else {//USER DID NOT HAS CART
    //             let cartObj = { 
    //                 user: objectId(userId),
    //                 sellers: {
    //                     sellerId:objectId(productDetails.adminId),
    //                     sellerProds:[prodObj]
    //                 }
    //             }
    //             db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
    //                 resolve()
    //             })
    //         }
    //     })
    // },
    minusFromCart: (prodId, userId) => {
        return new Promise(async(resolve, reject) => {
            // console.log(details)
            await db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId), 'product.item': objectId(prodId) },
            {
                $inc: { 'product.$.quantity': -1 }
            })
            await db.get().collection(collection.PRODUCT_COLLECTIONS).updateOne({ _id: objectId(prodId)},
            {
                $inc: { stock: 1 }
            }).then((response) => {
                resolve()
            })

        })
        // return new Promise( (resolve, reject) => {

        //     db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId),'product.item':objectId(prodId)},
        //     {
        //         $inc:{'product.$.quantity':-1}
        //     }).then(async(response)=>{
        //         let userCart =await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId),'product[0].item':objectId(prodId)})
        //         console.log('jooi');
        //         console.log(userCart);
        //         resolve()
        //     })
        // })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartCount = 0
            let cart = await db.get().collection(CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                // cartCount = cart.product.length
                let cartList = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match: { user: objectId(userId) }
                    },
                    {
                        $unwind: '$product'
                    },
                    {
                        $group:
                        {
                            _id: '$user',
                            cartCount: { $sum: "$product.quantity" },

                        }
                    }
                ]).toArray()
                cartCount=cartList[0].cartCount
                resolve(cartCount)
            }
            resolve(cartCount)
        })
    },
    getCartProductCount: (userId, prodId) => {
        return new Promise(async (resolve, reject) => {
            let changedItem = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        item: '$product.item',
                        quantity: '$product.quantity'
                    }
                },
                {
                    $lookup: {
                        from: 'product',
                        localField: 'item',
                        foreignField: '_id',
                        as: 'prod'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$prod', 0] }
                    }
                },
                {
                    $match: { item: objectId(prodId) }
                },
                {
                    $project: {
                        item: '$item',
                        quantity: '$quantity'
                    }
                }
            ]).toArray()
            // console.log('changed items');
            // console.log(changedItem);
            resolve(changedItem)
        })
    },
    getCartTotal: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        item: '$product.item',
                        quantity: '$product.quantity'
                    }
                },
                {
                    $lookup: {
                        from: 'product',
                        localField: 'item',
                        foreignField: '_id',
                        as: 'prod'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$prod', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.price' }] } }

                    }
                }
            ]).toArray()
            // console.log("8888888888888888888888888888888",total[0].total);
            resolve(total[0].total)
        })
    },
    getProductDetails: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let order = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                    }
                },
                {
                    $lookup: {
                        from: 'product',
                        localField: 'item',
                        foreignField: '_id',
                        as: 'prod'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$prod', 0] }
                    }
                }
            ]).toArray()
            // console.log('--------prooooooducts');

            // console.log(order[0]);
            resolve(order)
        })
    },
    getOrderDetails: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let order = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
            ]).toArray()
            // console.log('in orderviewlist');

            // console.log(order[0]);
            resolve(order[0])
        })
    },
    getOrderList: (user) => {
        return new Promise(async (resolve, reject) => {
            let order = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { userId: objectId(user) }
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        paymentMethod: '$paymentMethod',
                        status: '$status',
                        date: '$date'
                    }
                },
                {
                    $lookup: {
                        from: 'product',
                        localField: 'item',
                        foreignField: '_id',
                        as: 'prod'
                    }
                },
                {
                    $project: {
                        paymentMethod: 1,
                        status: 1,
                        date: 1,
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$prod', 0] }
                    }
                }
            ]).toArray()
            // console.log(order);
            resolve(order)
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        item: '$product.item',
                        quantity: '$product.quantity',
                        adminId: '$product.adminId'
                    }
                },
                {
                    $lookup: {
                        from: 'product',
                        localField: 'item',
                        foreignField: '_id',
                        as: 'prod'
                    }
                },
                {
                    $project: {
                        adminId:1,
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$prod', 0] }
                    }
                }
                // {
                //     $lookup:{
                //         from:collection.PRODUCT_COLLECTIONS,
                //         let:{prodList:'$product'},
                //         pipeline:[{
                //             $match:{
                //                 $expr:{
                //                     $in:['$_id','$$prodList']
                //                 }
                //             }
                //         }],
                //         as:'cartItems'
                //     }
                // }
            ]).toArray()
            // console.log('----------------------------------------get cart products');
            // console.log(cartItems);
            resolve(cartItems)
        })
    },
    removeFromCart: (details) => {
        qty=parseInt(details.qty)
        return new Promise(async(resolve, reject) => {
            await db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart) },
            {
                $pull: { product: { item: objectId(details.product) } }
            })
            await db.get().collection(collection.PRODUCT_COLLECTIONS).updateOne({ _id: objectId(details.product)},
            {
                $inc: { stock: qty }
            }).then(async (response) => {
                let prod = await db.get().collection(collection.CART_COLLECTION).findOne({ _id: objectId(details.cart) })
                if(prod){
                    if (prod.product.length > 0) {
                        console.log('prod', prod);
                        resolve(true)
                    }
                    else {
                        db.get().collection(collection.CART_COLLECTION).deleteOne({ _id: objectId(details.cart) })
                        resolve(false)
                    }
                }

            })

        })
    },
    placeOrder: (order, total, products) => {
        return new Promise((resolve, reject) => {
            // console.log('in order');
            // console.log(order,total,products);
            let status = order['payment-method'] === 'COD' ? 'Placed' : 'Pending'
            let orderObj = {
                userId: objectId(order.userId),
                deliveryDetails: {
                    firstName: order.fname,
                    lastName: order.lname,
                    email: order.email,
                    phone: order.phone,
                    address: order.address,
                    city: order.city,
                    state: order.state,
                    country: order.country,
                    pin: order.pincode
                },
                paymentMethod: order['payment-method'],
                totalPrice: total,
                products: products,
                status: status,
                date: new Date().toISOString().split('T')[0]
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((data) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(order.userId)})
                // console.log(data.insertedId.toString(), 'kkkk');
                // console.log('inserted order',orderObj)
                resolve(data.insertedId.toString())
            })
        })
    },
    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {
                console.log(order);
                resolve(order)
            });
        })
    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cart.product)
            console.log('in place order',cart)
        })

    }


}