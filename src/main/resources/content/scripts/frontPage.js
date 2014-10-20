define(["jquery", "http", "modernizr", "fastclick", "foundation.reveal"],
    function($, http, Modernizr, FastClick){
        $(document).foundation({});
        var body = $("body"),
            newBacklogModal = body.find("#new-backlog-modal"),
            archiveModal = body.find("#archive-modal");

        $(document).on('opened.fndtn.reveal', '[data-reveal]', function () {
            var modal = $(this).attr('id');
            if (modal===newBacklogModal.attr('id')) {
                newBacklogModal.find("#new-backlog-name").focus();
            }
        });
        newBacklogModal.find(".cancel-button").click(function() {
            newBacklogModal.foundation('reveal', 'close');
        });
        newBacklogModal.find(".create-button").click(function() {
            var newName = newBacklogModal.find("#new-backlog-name").val();
            if (newName===null || !newName) {
                newBacklogModal.foundation('reveal', 'close');
            }
            else {
                http({
                    url: "/api/backlogs",
                    method: "POST",
                    data:JSON.stringify({
                        id:"whatever",
                        name:newName,
                        memo:"Initial Version",
                        items:[]
                    }),
                    onResponse: function (response) {
                        if(response.status === 201){
                            window.location.reload();
                        }else{
                            alert("ERROR: " + response.status);
                        }
                    }
                });
            }
        });

        archiveModal.find(".cancel-button").click(function() {
            archiveModal.foundation('reveal', 'close');
        });

        var backlogList = body.find(".backlog-list")
        var settingsArea = body.find("#settings-modal");


        var globalConfig;
        http({
            url: "/api/config",
            method: "GET",
            onResponse: function (response) {
                globalConfig = JSON.parse(response.body);
                var selector = "input[type=radio][value=" + globalConfig.defaultChartType + "]";
                settingsArea.find(selector).attr("checked", "true");
            }
        });

        settingsArea.find("input[type=radio]").click(function(){
            var defaultChartType = settingsArea.find("input[type=radio]:checked").val();
            http({
                url: "/api/config",
                method: "PUT",
                data:JSON.stringify({
                    defaultChartType:defaultChartType
                }),
                onResponse: $.noop
            });
        });

        http({
            url: "/api/backlogs",
            method: "GET",
            onResponse: function (response) {
                var backlogs=JSON.parse(response.body);
                var showArchivedButton = body.find(".archived-toggle-button");

                showArchivedButton.click(function(){
                    showArchivedButton.parent().toggleClass('active');
                    var isChecked = showArchivedButton.parent().hasClass('active');
                    var entries = body.find(".archived-backlog-list-entry");
                    if(isChecked){
                        entries.slideDown();
                    }else{
                        entries.slideUp();
                    }
                });

                //var backlogs = allBacklogs;

                function sortByName(a, b){
                    var aName = a.name==null?"unnamed":a.name.toLowerCase();
                    var bName = b.name==null?"unnamed":b.name.toLowerCase();
                    return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
                }

                backlogs.sort(sortByName);

                $.each(backlogs, function(idx, backlog){
                    var entry;

                    entry = $('<div class="row backlog-row"><div class="small-9 columns backlog-list-entry"><a href="/backlog/' + backlog.id + '"></a></div><div class="small-3 columns"><button class="tiny radius archive-button">archive</button></div></div>');

                    function isArchived(){
                        var val = backlog.whenArchived!==null;
                        return val;
                    }
                    function redraw(){
                        var name = isArchived() ? backlog.name + " [ARCHIVED]" : backlog.name;
                        entry.find("a").text(name);
                        if(isArchived()){
                            entry.addClass("archived-backlog-list-entry")
                            entry.toggle(body.find("#show-archived-checkbox").is(":checked"));
                            entry.find('.archive-button').prop('disabled', true);
                        }else {
                            entry.removeClass("archived-backlog-list-entry")
                        }

                    }
                    redraw();

                    entry.find(".archive-button").click(function (){
                        var modal = $('#archive-modal');

                        modal.find('.backlog-name').text(backlog.name);
                        modal.find('.archive-confirm-button').click(function() {
                         http({
                            url: "/api/backlogs/" + backlog.id + "/status",
                            method: "PUT",
                            data:JSON.stringify({
                                archived:!isArchived()
                            }),
                            onResponse: function (response) {
                                if(response.status === 200){
                                    backlog = JSON.parse(response.body);
                                    modal.foundation('reveal', 'close');
                                    redraw();
                                }else{
                                    alert("ERROR: " + response.status);
                                }
                            }
                        });
                        });
                        modal.foundation('reveal', 'open');
                        return;

                   });

                    body.find("#backloglist").append(entry);
                });
            }
        });
    });
