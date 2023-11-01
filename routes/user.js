const { response } = require('express');
var express = require('express')
app = express()
bodyParser = require("body-parser")
var router = express.Router();
var productHelper = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
// var userHelper = require('../helpers/user-helpers')
app.use(bodyParser.urlencoded({ extended: true }));

const verifyLogin = (req, res, next) => {
  if (req.session.userloggedIn) {
    next()
  } else {

    res.redirect('/login')
  }
}
router.get('/profile', verifyLogin, (req, res) => {
  user=req.session.user
  res.render('user/profile',{user})
})
// first page
router.get('/', async function (req, res, next) {
  let user = req.session.user
  let cartCount = 0
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id,)
  }
  userHelpers.getAllCategories().then((cat) => {
    res.render('user/view-categories', { cat, user, cartCount })
  })
  // productHelper.getAllProducts().then((products)=>{
  //   res.render('user/view-products', { products, user,cartCount})
  // })

})

router.get('/view-product/:category', async (req, res) => {
  let user = null
  let cartCount = 0
  if (req.session.user) {
    user = req.session.user
    cartCount = await userHelpers.getCartCount(req.session.user._id,)
  }
  let selectedProducts = await userHelpers.getSameCategoryProducts(req.params.category)

  res.render('user/view-products', { selectedProducts, user, cartCount })

})

router.get('/view-product-details/:prodId', async (req, res) => {
  let user = null
  let cartCount = null
  if (req.session.user) {
    user = req.session.user
    cartCount = await userHelpers.getCartCount(req.session.user._id,)
  }
  let product = await userHelpers.selectedProductDetails(req.params.prodId)
  res.render('user/viewProductDetails', { product, user, cartCount })

})
// router.post('/view-product-details',verifyLogin,(req,res)=>{
//     userHelpers.addToCartQty(req.body,req.session.user._id).then((response)=>{
//     res.redirect('/cart')
//   })
// })
router.post('/view-product-details', verifyLogin, async (req, res) => {
  // console.log('request . body  in post view product details----------------------------------------------',req.body);
  await userHelpers.updateStock(req.body.prodId, req.body.quantity)
    // console.log('return value in post view product details----------------00',response);
    if (response.status == '') {
      console.log('Only limited quantity is available')
      res.redirect('back')


    } else if (response.status === 'false') {
      await userHelpers.addToCartQty(req.body, req.session.user._id)
      console.log('qantity is now out of stock')
      let cartItems = null
      cartItems = await userHelpers.getCartProducts(req.session.user._id)
      let total = null
      if(cartItems!=''){
        total = await userHelpers.getCartTotal(req.session.user._id)
      }
      res.render('user/cart', { cartItems, user: req.session.user, total })



    } else {
      // location. reload()
      await userHelpers.addToCartQty(req.body, req.session.user._id)
      console.log(' quantity is available')
      let cartItems = null
      cartItems = await userHelpers.getCartProducts(req.session.user._id)
      let total = null
      if(cartItems!=''){
        total = await userHelpers.getCartTotal(req.session.user._id)
      }
      res.render('user/cart', { cartItems, user: req.session.user, total })
    }
})

router.post('/verfiy-payment', (req, res) => {
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changeOrderStatus(req.body['order[receipt]']).then(() => {
      res.json({ status: true })
    })
  }).catch((err) => {
    res.json({ status: 'payment fail' })
  })
})
/* GET home page. */
// router.get('/',async function (req, res, next) {
//   let user= req.session.user
//   let cartCount=null
//   if(req.session.user){
//      cartCount =await userHelpers.getCartCount(req.session.user._id,)
//   }
//   productHelper.getAllProducts().then((products)=>{
//     res.render('user/view-products', { products, user,cartCount})
//   })
// })
router.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/login', { loginErr: req.session.loginErr })
    req.session.loginErr = false
  }
})
router.get('/signup', (req, res) => {
  res.render('user/signup')
})
router.post('/signup', (req, res) => {
  userHelpers.doSignup(req.body).then((response) => {
    req.session.user = response.user
    req.session.user.loggedIn = true

    res.redirect('/')
  })
})
router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user
      req.session.userloggedIn = true
      res.redirect('back')
    } else {
      req.session.loginErr = 'Username or Password is wrong'
      res.redirect('/login')
    }
  })
})
router.get('/logout', (req, res) => {
  req.session.user=null 
  req.session.userloggedIn=false
  res.redirect('/')
})
router.get('/placeorder', verifyLogin, async (req, res) => {
  let cartItems = await userHelpers.getCartProducts(req.session.user._id)
  let total = await userHelpers.getCartTotal(req.session.user._id)
  res.render('user/placeOrder', { cartItems, user: req.session.user, total })
})
router.post('/placeOrder', async (req, res) => {
  let total = await userHelpers.getCartTotal(req.session.user._id)
  products = await userHelpers.getCartProductList(req.session.user._id)
  userHelpers.placeOrder(req.body, total, products).then((orderId) => {
    if (req.body['payment-method'] === 'COD') {
      res.json({ codSuccess: true })
    } else {
      userHelpers.generateRazorpay(orderId, total).then((order) => {
        res.json(order)
      })
    }
  })
})
router.get('/cart', verifyLogin, async (req, res) => {
  let cartItems = null
  cartItems = await userHelpers.getCartProducts(req.session.user._id)
  let total = null
  if(cartItems!=''){
    total = await userHelpers.getCartTotal(req.session.user._id)
  }
  res.render('user/cart', { cartItems, user: req.session.user, total })
})

// router.get('/add-to-cart/:id',verifyLogin,(req,res)=>{
//   console.log(req.params.id);
//   userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
//   res.redirect('/')
//   })
// })
router.get('/ajax-add-to-cart/:id', async (req, res) => {
  cartCount = 0
  if (req.session.user) {
    var response = await userHelpers.minusFromStock(req.params.id)
    if (response.updated) {
      let productDetails=await userHelpers.selectedProductDetails(req.params.id)
      // console.log('ajax-add-to-cart /productdetails',productDetails);
      await userHelpers.addToCart(productDetails, req.session.user._id)
      cartCount = await userHelpers.getCartCount(req.session.user._id,)
      res.json({ count: cartCount, stockFlag: response.available })
    } else {
      res.json({ count: cartCount, stockFlag: null })
    }
  }else{
    res.json({ notlogin:true})

  }
  
})
router.get('/ajax-minus-from-cart/:id', async(req, res) => {
    await userHelpers.minusFromCart(req.params.id, req.session.user._id)
        userHelpers.updateAvailableStatus(req.params.id)
        // console.log(req.session.user._id)
        // let cartItems =await userHelpers.getCartProducts(req.session.user._id)
        // console.log(cartItems);
        let total = await userHelpers.getCartTotal(req.session.user._id)

        changedItem = await userHelpers.getCartProductCount(req.session.user._id, req.params.id)
        // console.log(changedItem[0].quantity);
        res.json({ item: changedItem[0].item, quantity: changedItem[0].quantity, total: total })
   
})
router.get('/ajax-plus-from-cart/:id', async (req, res) => {

//   console.log('re=======================================',req.params);
  var response = await userHelpers.minusFromStock(req.params.id)
  if (response.updated) {
    let productDetails=await userHelpers.selectedProductDetails(req.params.id)

    userHelpers.addToCart(productDetails, req.session.user._id).then(async () => {
      // console.log(req.session.user._id)
      // let cartItems =await userHelpers.getCartProducts(req.session.user._id)
      // console.log(cartItems);
      let total = await userHelpers.getCartTotal(req.session.user._id)
      // console.log('plus form cart',total);
      // alert('******',total)
      changedItem = await userHelpers.getCartProductCount(req.session.user._id, req.params.id)
      res.json({ item: changedItem[0].item, quantity: changedItem[0].quantity, total: total })
    })
  }






})
router.post('/ajax-remove-from-cart', (req, res, next) => {
    // console.log('request remove from cart',req.body);
  userHelpers.removeFromCart(req.body).then((response) => {
    userHelpers.updateAvailableStatus(req.body.product)
    res.json(response)
  })
})
router.get('/order', verifyLogin, async (req, res) => {
  let order = await userHelpers.getOrderList(req.session.user._id)
  res.render('user/order', { order, user: req.session.user })
})
router.get('/viewOrder/:orderId', async (req, res) => {
  let order = await userHelpers.getOrderDetails(req.params.orderId)
  let orderItems = await userHelpers.getProductDetails(req.params.orderId)
  res.render('user/viewOrder', { order, orderItems, user: req.session.user })

})



module.exports = router; 
