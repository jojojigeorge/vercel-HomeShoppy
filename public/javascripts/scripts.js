// const { response } = require("express")




function addToCart(prodId){
    // let quantity=document.getElementById(prodId).innerHTML
    // alert(prodId)
    $.ajax({
        url:'/ajax-add-to-cart/'+prodId,
        method:'get',
        success:(response)=>{
            let count = response.count
            if(response.stockFlag){
                // location. reload()

                document.getElementById('cartId').innerHTML=count
                // $('#cartId').html(count)
            }
            else if(response.notlogin){
                alert('Please Login')
            }
            else{

                location. reload()
            }
            
        }
    })
}

function minusFromCart(prodId){
    let quantity=document.getElementById(prodId).innerHTML
    if(quantity!=1){
        $.ajax({
            url:'/ajax-minus-from-cart/'+prodId,
            method:'get',
            success:(response)=>{
                // alert(response.total)
                // console.log('ajax il');
                // console.log(response);
                // let item =response.item
                // let count = response.quantity
                // let total = response.total
                // $('#prodId').html(count)
                document.getElementById(prodId).innerHTML=response.quantity
                document.getElementById('carttotal').innerHTML=response.total
            }
        })
    }
}
function plusFromCart(prodId){
    
    $.ajax({
        url:'/ajax-plus-from-cart/'+prodId,
        method:'get',
        success:(response)=>{
            // alert(response.total)
            // console.log('ajax il');
            // console.log(response);
            let item =response.item
            let count = response.quantity
            // $('#prodId').html(count)
            document.getElementById('carttotal').innerHTML=response.total
            document.getElementById(prodId).innerHTML=response.quantity
        }
    })
}

function shipped(orderId){
    
    $.ajax({
        url:'/admin/shipped/'+orderId,
        method:'get',
        success:(response)=>{
            document.getElementById('status_id').innerHTML='shipped'
        }
    })
}

function removeFromCart(cartId,prodId,qty){
    $.ajax({
        url:'/ajax-remove-from-cart',
        data:{
            cart:cartId,
            product:prodId,
            qty:qty
        },
        method:'post',
        success:(response)=>{
            if(response){
                alert("Product is removed successfully")
                location.reload()
            }
            else{
                window.location.href = "/"

            }
        }
    })
}
// increment and decrement button in product details page
function incrementBtn(){
    var value = parseInt(document.getElementById('quantity_id').value, 10);
    value = isNaN(value) ? 0 : value;
    value++;
    document.getElementById('quantity_id').value = value;
}
function decrementBtn(){
    var value = parseInt(document.getElementById('quantity_id').value, 10);
    value = isNaN(value) ? 0 : value;
    if(value!=1){
        value--;
        document.getElementById('quantity_id').value = value;
    }
    
}

