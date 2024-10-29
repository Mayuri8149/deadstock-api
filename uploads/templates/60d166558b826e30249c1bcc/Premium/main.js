$(".fa-angle-down").click(function(){
    $(this).toggleClass("down");
})

// -----------------------------------------------------------
$(".source-btn").on("click",function(){
    var a = document.getElementById('one');
    a.style.display = "block";
    var b = document.getElementById('two');
    b.style.display = "none";
    var c = document.getElementById('three');
    c.style.display = "none";
    var d = document.getElementById('four');
    d.style.display = "none";
})

$("#location-history-button").on("click",function(){
    var x = document.getElementById('info-location');
    x.style.display = "none";
    var y = document.getElementById('info-location-history');
    y.style.display = "block";
    var current = document.getElementById("location-button");
    current.className = current.className.replace(" active", "");
    current.disabled = false;
    var present = document.getElementById("location-history-button");
    present.className = present.className.replace("info-buttons location-history", "info-buttons location-history active");
    present.disabled = true;
})

$("#location-button").on("click",function(){
    var x = document.getElementById('info-location-history');
    x.style.display = "none";
    var y = document.getElementById('info-location');
    y.style.display = "block";
    var current = document.getElementById("location-history-button");
    current.className = current.className.replace(" active", "");
    current.disabled = false;
    var present = document.getElementById("location-button");
    present.className = present.className.replace("info-buttons location", "info-buttons location active");
    present.disabled = true;
})
// ---------------------------------------------------------------------------------------

$(".production-btn").on("click",function(){
    var a = document.getElementById('one');
    a.style.display = "none";
    var b = document.getElementById('two');
    b.style.display = "block";
    var c = document.getElementById('three');
    c.style.display = "none";
    var d = document.getElementById('four');
    d.style.display = "none";
})

$("#processing-button").on("click",function(){
    var x = document.getElementById('info-production-process');
    x.style.display = "none";
    var y = document.getElementById('info-processing');
    y.style.display = "block";
    var current = document.getElementById("production-process-button");
    current.className = current.className.replace(" active", "");
    current.disabled = false;
    var present = document.getElementById("processing-button");
    present.className = present.className.replace("info-buttons processing", "info-buttons processing active");
    present.disabled = true;
})

$("#production-process-button").on("click",function(){
    var x = document.getElementById('info-processing');
    x.style.display = "none";
    var y = document.getElementById('info-production-process');
    y.style.display = "block";
    var current = document.getElementById("processing-button");
    current.className = current.className.replace(" active", "");
    current.disabled = false;
    var present = document.getElementById("production-process-button");
    present.className = present.className.replace("info-buttons production-process", "info-buttons production-process active");
    present.disabled = true;
})

$("#read-more-one").on("click",function(){
    var x = document.getElementById('production-image');    
    x.style.display = "block";
    var y = document.getElementById('read-more-one');
    y.style.display = "none";
})

$("#read-more-two").on("click",function(){
    var x = document.getElementById('production-process-image');    
    x.style.display = "block";
    var y = document.getElementById('read-more-two');
    y.style.display = "none";
})

// ---------------------------------------------------------------------------------------

$(".quality-btn").on("click",function(){
    var a = document.getElementById('one');
    a.style.display = "none";
    var b = document.getElementById('two');
    b.style.display = "none";
    var c = document.getElementById('three');
    c.style.display = "block";
    var d = document.getElementById('four');
    d.style.display = "none";
})

$("#read-more-three").on("click",function(){
    var x = document.getElementById('analytical-data-image');    
    x.style.display = "block";
    var y = document.getElementById('read-more-three');
    y.style.display = "none";
})

$("#organic-production-button").on("click",function(){
    var x = document.getElementById('info-organic-production');
    x.style.display = "block";
    var y = document.getElementById('info-analytical-data');
    y.style.display = "none";
    var z = document.getElementById('info-certified-quality');
    z.style.display = "none";

    var current = document.getElementById("analytical-data-button");
    current.className = current.className.replace(" active", "");
    current.disabled = false;
    var current_two = document.getElementById("certified-quality-button");
    current_two.className = current_two.className.replace(" active", "");
    current_two.disabled = false;
    var present = document.getElementById("organic-production-button");
    present.className = present.className.replace("info-buttons organic-production", "info-buttons organic-production active");
    present.disabled = true;
})

$("#analytical-data-button").on("click",function(){
    var x = document.getElementById('info-organic-production');
    x.style.display = "none";
    var y = document.getElementById('info-analytical-data');
    y.style.display = "block";
    var z = document.getElementById('info-certified-quality');
    z.style.display = "none";

    var current = document.getElementById("organic-production-button");
    current.className = current.className.replace(" active", "");
    current.disabled = false;
    var current_two = document.getElementById("certified-quality-button");
    current_two.className = current_two.className.replace(" active", "");
    current_two.disabled = false;
    var present = document.getElementById("analytical-data-button");
    present.className = present.className.replace("info-buttons analytical-data", "info-buttons analytical-data active");
    present.disabled = true;
})

$("#certified-quality-button").on("click",function(){
    var x = document.getElementById('info-organic-production');
    x.style.display = "none";
    var y = document.getElementById('info-analytical-data');
    y.style.display = "none";
    var z = document.getElementById('info-certified-quality');
    z.style.display = "block";

    var current = document.getElementById("organic-production-button");
    current.className = current.className.replace(" active", "");
    current.disabled = false;
    var current_two = document.getElementById("analytical-data-button");
    current_two.className = current_two.className.replace(" active", "");
    current_two.disabled = false;
    var present = document.getElementById("certified-quality-button");
    present.className = present.className.replace("info-buttons certified-quality", "info-buttons certified-quality active");
    present.disabled = true;
})


// ---------------------------------------------------------------------------------------

$(".transparency-btn").on("click",function(){
    var a = document.getElementById('one');
    a.style.display = "none";
    var b = document.getElementById('two');
    b.style.display = "none";
    var c = document.getElementById('three');
    c.style.display = "none";
    var d = document.getElementById('four');
    d.style.display = "block";
})

$("#read-more-four").on("click",function(){
    var x = document.getElementById('transparency-image');    
    x.style.display = "block";
    var y = document.getElementById('read-more-four');
    y.style.display = "none";
})

$("#eu-comparison-button").on("click",function(){
    var x = document.getElementById('info-transparency');
    x.style.display = "none";
    var y = document.getElementById('info-eu-comparison');
    y.style.display = "block";
    var current = document.getElementById("transparency-button");
    current.className = current.className.replace(" active", "");
    current.disabled = false;
    var present = document.getElementById("eu-comparison-button");
    present.className = present.className.replace("info-buttons eu-comparison", "info-buttons eu-comparison active");
    present.disabled = true;
})

$("#transparency-button").on("click",function(){
    var x = document.getElementById('info-eu-comparison');
    x.style.display = "none";
    var y = document.getElementById('info-transparency');
    y.style.display = "block";
    var current = document.getElementById("eu-comparison-button");
    current.className = current.className.replace(" active", "");
    current.disabled = false;
    var present = document.getElementById("transparency-button");
    present.className = present.className.replace("info-buttons transparency", "info-buttons transparency active");
    present.disabled = true;
})