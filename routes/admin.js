const { response } = require('express');

var express = require('express');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
const verifyLogin = (req, res, next) => {
    if (req.session.adminloggedIn) {
      next()
    } else {
        res.render('admin/adminLogin', { admin: true })
    //   res.redirect('/adminLogin')
    }
  }

router.get('/shipped/:id',verifyLogin, async (req, res) => {

      console.log('re=======================================',req.params);
      var response = await productHelpers.shipped(req.params.id)
      res.json({ shippedFlag:true})
    })

// router.get('/viewAdminOrder/:orderId',verifyLogin, async (req, res) => {
//     let orderItems = await productHelpers.getProductAdminDetails(req.params.orderId)
//     details=orderItems[0]
//     // console.log('admin order table list',details);
//     res.render('admin/viewAdminOrder', {admin:req.session.admin, orderItems,details})
  
//   })
router.get('/viewAdminOrder/',verifyLogin, async (req, res) => {
    let sellerId = req.session.admin._id
    let orderId = req.query.orderId
    // console.log('parameter passed',sellerId,orderId)
        let orderItems = await productHelpers.getProductAdminDetails(orderId,sellerId)
        let details= await productHelpers.getAddress(orderId)
        // details=orderItems[0]
        // console.log('admin router/viewAdminOrder',orderItems.orderItems);
        // console.log('admin router/viewAdminOrder',orderItems.products[0]);
        // console.log('admin order table list',details[0]);
        res.render('admin/viewAdminOrder', {admin:req.session.admin,orderItems:orderItems.orderItems,details:details[0]})
  })

router.get('/allAdminOrders',verifyLogin, async (req, res) => { 
    let order = await productHelpers.getOrderList(req.session.admin._id)
    // console.log("address:",order[0])
    res.render('admin/allAdminOrders', { order,admin:req.session.admin})
  })
router.get('/adminSignup', (req, res) => {
    res.render('admin/adminSignup', { admin: req.session.admin })
})
router.post('/adminSignup',(req, res) => {
    productHelpers.doAdminSignup(req.body).then((response) => {
        // console.log(response)
        console.log('----------------------')
        req.session.admin = response.admin
        req.session.adminloggedIn = true
        console.log('session', req.session)

        res.redirect('/admin')
    })
})
router.get('/adminLogout', (req, res) => {
    req.session.admin = null
    req.session.adminloggedIn = false
    res.redirect('/admin')
})

router.get('/adminLogin', (req, res) => {
    res.render('admin/adminLogin', { admin: true })
})

router.post('/adminLogin', (req, res) => {
    productHelpers.doAdminLogin(req.body).then(async(response) => {
        
        if (response.status) {
            req.session.admin = response.admin
            req.session.adminloggedIn = true
            // console.log('session', req.session)
            res.redirect('/admin')
        } else {
            // req.session.loginErr = 'Username or Password is wrong'
            res.render('admin/adminLogin', { admin: true ,loginErr: response.loginErr})
        }
    })
})

router.get('/',verifyLogin, async (req, res) => {
    let adminSes = req.session.admin
    // console.log('admin value session',adminSes._id);
    // adminSes.admin=true
    // console.log('in admin router /',req.session);
    let products = await productHelpers.getAllProducts(adminSes._id)
    let category = await productHelpers.getAllCategories(adminSes._id)
    if (adminSes) {
        res.render('admin/viewProducts', {  products, category,admin:req.session.admin })

    }else{
        res.render('admin/viewProducts', { products, category, admin: true })
    }
})
/* GET users listing. */
// router.get('/', function (req, res, next) {
//   productHelpers.getAllProducts().then((products)=>{
//     // console.log(products)
//     res.render('admin/viewProducts', { products, admin: true })
//   })
// })


router.get('/add-product',verifyLogin, async (req, res) => {
    let adminId=req.session.admin._id
    // console.log('adminId',adminId);
    let allCategory = await productHelpers.getAllCategory(adminId)
    res.render('admin/add-product', { allCategory, admin: req.session.admin })

})
router.post('/add-product', function (req, res, next) {
    // var e = document.getElementById("selectValue");
    // var value = e.value;
    // console.log(value);
    // console.log(req.files);
    productHelpers.addProduct(req.body, (id) => {
        let image = req.files.photo
        image.mv('./public/product-image/' + id + '.jpg', (err, done) => {
            if (!err) {
                res.render('admin/add-product', { admin: req.session.admin })
            } else {
                console.log(err);
            }
        })
    })
})

router.get('/delete-product/:id',verifyLogin, (req, res) => {
    let proId = req.params.id
    // console.log(proId);
    productHelpers.deleteProduct(proId).then((response) => {
        // console.log(response);
        res.redirect('/admin')
    })
})

router.get('/edit-product/:id',verifyLogin, async (req, res) => {
    let allCategory = await productHelpers.getAllCategory()

    let product = await productHelpers.getProdctDetails(req.params.id)
    // console.log(product);
    res.render('admin/edit-product', { allCategory, admin: req.session.admin, product })
})

router.post('/edit-product/:id', (req, res) => {
    let id = req.params.id
    productHelpers.updateProduct(req.params.id, req.body).then(() => {
        try {
            res.redirect('/admin')
            if (req.files.photo) {
                let image = req.files.photo
                image.mv('./public/product-image/' + id + '.jpg')

            }
        } catch (error) {

        }

    })
})

router.get('/add-category',verifyLogin, function (req, res) {
    res.render('admin/add-category', { admin: req.session.admin })

})
router.post('/add-category', function (req, res, next) {
    productHelpers.addCategory(req.body, (id) => {
        let image = req.files.photo
        image.mv('./public/category-image/' + id + '.jpg', (err, done) => {
            if (!err) {
                res.render('admin/add-category', { admin: req.session.admin })
            } else {
                console.log(err);
            }
        })
    })
})
router.get('/delete-category/:id',verifyLogin, (req, res) => {
    let proId = req.params.id
    // console.log('categoryId:',proId);
    productHelpers.deleteCategory(proId).then((response) => {
        // console.log(response);
        res.redirect('/admin')
    })
})
router.get('/edit-category/:id',verifyLogin, async (req, res) => {
    let category = await productHelpers.getCategoryDetails(req.params.id)
    console.log(category);
    res.render('admin/edit-category', { category, admin: req.session.admin })
})
router.post('/edit-category/:id', async (req, res) => {
    let id = req.params.id
    await productHelpers.updateCategory(req.params.id, req.body)
    try {
        res.redirect('/admin')
        if (req.files.photo) {
            let image = req.files.photo
            image.mv('./public/category-image/' + id + '.jpg')
        }
    } catch (error) {

    }


})


module.exports = router;
