

$('input').on('keypress', async (e) => {
    // e.preventDefault();
    var code = e.keyCode || e.which;
    if(code==13){
        const pwd = {
            'pwd': $('input').val()
        };
        if (pwd['pwd'].length == 0) {
            return;
        }
        // let response = await fetch(HD_AUTHORIZE_API, {
        //     method: 'POST',
        //     body: JSON.stringify(pwd)
        //   });
        // response
        //     .then(response => response.json())
        //     .then(data => {
        //         console.log(data);
        //     });
        
        $(".authenticateSection").fadeOut(1000, () => {
            $(".scroller").fadeIn(100, () => {
                displayStats(CLIENT_NAME);
            });
            
        });
    }
});