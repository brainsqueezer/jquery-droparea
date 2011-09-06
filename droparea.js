(function( $ ){
    var s;
    // Methods
    var m = {
        init: function(e){},
        start: function(e){},
        complete: function(r){},
        error: function(r){ alert(r.error); return false; },
        traverse: function(files, area) {

            var form = area.parents('form');
            form.find('input[name="tmp_filename"], input[name="tmp_filetype"]').remove();

            if (typeof files !== "undefined") {
                if (m.check_files(files, area)) {
                    for (var i=0, l=files.length; i<l; i++) {
                        m.upload(files[i], area);
                    }
                }
            } else {
                mDialog.notify("{% trans _('formato no reconocido') %}", 5);
            }
        },

        check_files: function(files, area) {
            if (files != undefined) {
                for (var i = 0; i < files.length; i++) {
                    // File type control
                    if (typeof FileReader === "undefined" || !(/image/i).test(files[i].type)) {
                        mDialog.notify("{% trans _('sólo se admiten imágenes') %}", 5);
                        return false;
                    }
                    if (files[i].fileSize > s.maxsize) {
                        mDialog.notify("{% trans _('tamaño máximo excedido') %}" + ":<br/>" + files[i].fileSize + " > " + s.maxsize + " bytes", 5);
                        return false;
                    }
                }
                return true;
            }
        },

        upload: function(file, area) {
            var form = area.parents('form');
            var progress = form.find('progress').show();
            var thumb = form.find('.droparea_info img');

            progress.attr('max', file.fileSize).attr('value', 0);

            var xhr = new XMLHttpRequest();

            // Update progress bar
            xhr.upload.addEventListener("progress", function (e) {
                if (e.lengthComputable) {
                    progress.attr("value", e.loaded);
                    //var loaded = Math.ceil((e.loaded / e.total) * 100) + "%";
                }
            }, false);

            // File uploaded
            xhr.addEventListener("load", function (e) {
                var r = jQuery.parseJSON(e.target.responseText);
                if (typeof r.error === 'undefined') {
                    thumb.attr('src', r.thumb).show();
                    progress.attr("value", file.fileSize);
                    form.find('input[name="tmp_filename"], input[name="tmp_filetype"]').remove();
                    form.append('<input type="hidden" name="tmp_filename" value="'+r.name+'"/>');
                    form.append('<input type="hidden" name="tmp_filetype" value="'+r.type+'"/>');
                    s.complete(r);
                } else {
                    s.error(r);
                }
                setTimeout(function () {progress.hide();}, s.hide_delay);
            }, false);

            xhr.open("post", s.post, true);

            // Set appropriate headers
            xhr.setRequestHeader("Content-Type", "multipart/form-data-alternate");
            xhr.setRequestHeader("X-File-Name", file.fileName);
            xhr.setRequestHeader("X-File-Size", file.fileSize);
            xhr.setRequestHeader("X-File-Type", file.type);

            xhr.send(file);
        }
    };
    $.fn.droparea = function(o) {
        // Check support for HTML5 File API
        if (!window.File) return;

        // Settings
        s = {
            'post': base_url + 'backend/tmp_upload.php',
            'init': m.init,
            'start': m.start,
            'complete': m.complete,
            'error': m.error,
            'maxsize': 500000, // Bytes
            'show_thumb': true,
            'hide_delay': 2000,
            'backgroundColor': '#AFFBBB',
            'backgroundImage': base_static +'img/common/picture_simple01.png'
        };

        this.each(function(){
            if(o) $.extend(s, o);
            var form = $(this);

            s.init(form);

            form.find('input[type="file"]').change(function () {
                m.traverse(this.files, $(this))
                $(this).val("");
            });

            if (s.show_thumb) {
                var thumb = $('<img width="40" height="40" style="float:right;"/>').hide();
                form.find('.droparea_info').append(thumb);
            }

            var progress = $('<progress value="0" max="0" style="float:right;margin-right:4px;"></progress>').hide();
            form.find('.droparea_info').append(progress);

            form.find('.droparea')
            .bind({
                dragleave: function (e) {
                    var area = $(this);
                    e.preventDefault();
                    area.css(area.data('bg'));
                },

                dragenter: function (e) {
                    e.preventDefault();
                    $(this).css({
                        'background-color': s.backgroundColor,
                        'background-image': 'url("'+s.backgroundImage+'")',
                        'background-position': 'center',
                        'background-repeat': 'no-repeat'
                        });

                },

                dragover: function (e) {
                    e.preventDefault();
                }
            })
            .each(function() {
                var bg;
                var area = $(this);

                bg = {
                    'background-color': area.css('background-color'),
                    'background-image': area.css('background-image'),
                    'background-position': area.css('background-position')
                }
                area.data("bg", bg);
                this.addEventListener("drop", function (e) {
                    e.preventDefault();
                    s.start(area);
                    m.traverse(e.dataTransfer.files, area);
                    area.css(area.data('bg'));
                },false);
            });
        });
    };
})( jQuery );
