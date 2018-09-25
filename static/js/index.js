$(function () {
    var username = $.cookie('username');

    if (username) {
        $('#username').html(username);
        $('#denglv').attr('data-toggle', 'dropdown')
    }


    //退出
    $('#tuichu').click(function (e) {
        e.preventDefault();
        $.get('/user/logout', (response) => {
            $('#myModal').find('.modal-body').html(response.msg).end().modal('show').on('hidden.bs.modal', function () {
                location.reload();
            })

        })
    })


    //提问
    $('#tiwen').click(function () {
        if (!username) {
            $('#myModal').find('.modal-body').html('您好，您还没有登陆').end().modal('show').on('hidden.bs.modal', function () {
                location.href = 'denglu.html'
            })
        }
        else {
            location.href = "ask.html"
        }
    })

    //渲染页面
    $.get('/getAllQuestions', (response) => {
        console.log(response.data);
        let html = template('teml', response.data);
        $('#content_box').html(html);
    })

    //回复 
    $('#content_box').delegate('form', 'submit', function (e) {
        e.preventDefault();
        if (username) {
            var content = $(this).find('textarea').val();
            var askDate = $(this).find('input[type = submit]').attr('id');
            var content = content.replace(/</g, '$lt;');
            content = content.replace(/>/g, '$gt;');
            $.post('/reply', { content: content, askDate: askDate }, (response) => {
                if (response.result == 1) {
                    $('#myModal').find('.modal-body').html('您好，回答成功').end().modal('show').on('hidden.bs.modal', function () {
                        location.reload();
                    })
                }
                else{
                    $('#myModal').find('.modal-body').html(response.msg).end().modal('show')
                }

            })
        }
        else {
            $('#myModal').find('.modal-body').html('您好，还没有登陆，无法回答').end().modal('show').on('hidden.bs.modal', function () {
                location.href = 'denglu.html';
            })
        }
    })


})