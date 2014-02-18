    //
    //  Buttons visual tests
    //  -----------------------------
    //
    lux.web.visual_test('buttons', function () {
        var c = this,
            web = lux.web,
            text = function (tag, text) {
                return $(document.createElement(tag)).html(text || '').appendTo(c);
            },
            btngroup = function () {
                return $(document.createElement('div')).addClass('btn-group').appendTo(text('p'));
            };

        text('h3', 'Buttons skins');
        _(web.SKIN_NAMES).forEach(function (name) {
            var p = text('p');
            p.append(web.create_button({text: name, icon: 'gears', skin:name}));
            p.append(' ');
            p.append(web.create_button({text: name, skin: name}));
        });
        text('h3', 'Buttons sizes');
        _.each(web.BUTTON_SIZES, function (name) {
            c.append(web.create_button({text: name, icon: 'gears', size: name}));
            c.append(' ');
        });
        text('h3', 'Buttons with tooltip');
        _.each(web.BUTTON_SIZES, function (name) {
            c.append(web.create_button({
                text: name,
                icon: 'gears',
                size: name,
                title: 'To disply tooltip, set the title atribute and add the tooltip class',
                classes: 'tooltip'
            }));
            c.append(' ');
        });

        text('h3', 'Button Groups');
        _.each(web.BUTTON_SIZES, function (name) {
            c.append(text('h6', name));
            var b = btngroup();
            b.append(web.create_button({icon: 'download-alt', size:name}));
            b.append(web.create_button({icon: 'bar-chart', size:name}));
            b.append(web.create_button({icon: 'dashboard', size:name}));
            b.append(web.create_button({icon: 'print', size:name}));
        });
    });