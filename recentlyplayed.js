/**
* Ce module permet d'aller rechercher le xml  complet de toutes les chansons recemment joué et les affichées.
* La pagination va se faire dans le pagination.js
* @module   bui/RecentlyPlayed
* @requires module:lib/Base
* @requires module:jquery
* @requires module:bui/Ad
*/
define(['lib/Base', 'jquery', 'bui/Ad', 'lib/Functions'], function (Base, $, Ad, Functions) {

    var current_page = 1;
    var itemsPerPage = $('.base-recently-played').attr("data-nbElemParPage");
    var nbElementMax = $('.base-recently-played').attr("data-nbMaxElemAutorise");
    var urlService = $('.base-recently-played').attr("data-urlService");
    var defaultImage = $('.base-recently-played').attr("data-defaultImage");
    var totalItemsToShow = 20;
    var callsign = "";
    /**
     * @constructor
     * @augments Base
     */
    var RecentlyPlayed = Base.extend({
        defaultOptions: {
            pluginName            : "RecentlyPlayed",
            containerSelector     : ".base-recently-played",
            nextBtnSelector       : ".nextPage",
            prevBtnSelector       : ".prevPage",
            dropDownSelector      : ".dropdown-opt",
            traductionOfDe        : (Functions.getLocale() === "fr") ? "de" : "of",
            traductionTargetBlank : (Functions.getLocale() === "fr") ? "(Ce lien ouvre dans un nouvel onglet)":"(This link opens in a new window)",
        },

        main: function () {
            var self = this;
            self.displayRecentlyPlayed(true);
        },

        reload: function () {
            var self = this;
            self.displayRecentlyPlayed(true);
        },
        /**
         * cette fonction va permettre de traiter l'appel a l'API Triton,
         * traiter le json retourné par l'API et le traiter
         */
        displayRecentlyPlayed: function(init) {
            var self = this;
            callsign     = $(self.o.containerSelector).attr("data-recently-played");
            itemsPerPage = $(self.o.containerSelector).attr("data-nbElemParPage");
            nbElementMax = $(self.o.containerSelector).attr("data-nbMaxElemAutorise");
            urlService   = $(self.o.containerSelector).attr("data-urlService");
            defaultImage = $(self.o.containerSelector).attr("data-defaultImage");

            self.getRecentlyPlayed(callsign, itemsPerPage, current_page, urlService).then(function (data) {
                var $baseHtml = "";
                totalItemsToShow = data.results;
                for (let i = 0; i < data.songs.length; i++) {

                    let date = new Date(Number(data.songs[i].datetime));
                    let dateSongPlayed = self.getDate(date);
                    let title = data.songs[i].song;
                    let artist = data.songs[i].artist;

                    $baseHtml += "<li>";
                    $baseHtml += self.getTimeAndDate(dateSongPlayed, date);
                    $baseHtml += self.getCover(data.songs[i].cover, title, artist);
                    $baseHtml += self.getTitleAndLink(data.songs[i].artistRadio, title, artist);
                    $baseHtml += "</li>";
                }

                if(init){
                    self.createPagination();
                    self.triggerPrevPage();
                    self.triggerNextPage();
                    self.createDropDown();
                    self.triggerDropDown();
                }else{
                    $(".base-recently-played>ul.songs").empty();
                }

                $(".base-recently-played>ul.songs").append($baseHtml);
            });
        },

        createPagination : function(){
            var self = this;
            var numberOfPage = self.numPages();
            var lang = self.o.traductionOfDe;
            var $pagination = " <span class='arrow-l'> <span> "+lang+" </span> <span class='page-max'>" + numberOfPage + "</span> <a id='btn_prev' href='#' class='prevPage page-nolink' title=''> <span class='ico-prev disabled'></span> </a> </span> <span class='arrow-r'><a class='nextPage page-nolink' id='btn_next' href='#' title=''><span class='ico-next'></span></a> </span>";

            $(".pagination-top .btn-group").after($pagination);
            $(".pagination-bottom .btn-group").after($pagination);
        },

        triggerNextPage : function(){
            var self    = this;
            var nextBtn = self.o.nextBtnSelector;

            $(nextBtn).on('click', function() {
                self.pageSuivante();
            })
        },

        triggerPrevPage : function(){
            var self = this;
            var prevBtn = self.o.prevBtnSelector;

            $(prevBtn).on('click', function() {
                self.pagePrecedente();
            })
        },

        /** fonction qui permet de fabriquer la date correctement affiché */
        getDate : function(date){
            if(date){
                var day = date.getDate();
                var month = date.getMonth()+1; // janvier = 0
                var year = date.getFullYear();

                if(day<10){
                    day='0'+day;
                }
                if(month<10){
                    month='0'+month;
                }
                if(Functions.getLocale() === "fr"){
                    return day +"-"+month+"-"+year;
                }else{
                    return month +"-"+day+"-"+year;
                }
            }
        },
        /**
         * This function build the time and date section
         */
        getTimeAndDate : function(dateSongPlayed, date){
            var buildTimeAndDate = '<div class="timeAndDate">';
            var hour = "";
            if( Functions.getLocale() === "fr") {
                hour = date.toLocaleTimeString("fr-CA", {hour12: false, hour: '2-digit', minute: '2-digit'}).replace(/ /g, '');
            } else {
                hour = date.toLocaleTimeString("en-US", {hour12: true, hour: '2-digit', minute: '2-digit'});
                if(hour.includes("AM")){
                    hour = hour.replace("AM", "<span class='amPm'>am</span>")
                }else if(hour.includes("PM")){
                    hour = hour.replace("PM", "<span class='amPm'>pm</span>")
                }
            }

            buildTimeAndDate += '<time class="time date-translation"><span class="timeWrapper">'+hour+'</span></time>';
            buildTimeAndDate +=  '<time class="date">'+ dateSongPlayed+'</time>';
            buildTimeAndDate +=  '</div>';
            return buildTimeAndDate;
        },

        /**
         * This function build the cover section
         */
        getCover : function(cover, title, artist) {

            var buildCover = '<div class="recentlyPlayedPicture">';
            var image = (cover !== null && cover!== 'undefined' && Object.keys(cover).length > 0) ? cover : defaultImage;
                buildCover += '<img alt="' + title + ' - ' + artist + '" src="' + image + '">';
                buildCover += '</div>';
            return buildCover;
        },

        /**
         * This function build the titleAndLink section
         */
        getTitleAndLink : function(url, title, artist){
            var self = this;
            var buildArtist  = '<div class="titleAndLink">';
            buildArtist += '<span class="title">'+title+'</span>';

            if(url && Object.keys(url).length>0){
                if(url.url) {
                    buildArtist += '<a class="artistLink" href="' + url.url + '" title="' + artist + '" target="_blank">' + artist + '<span class="sr-only">' + self.o.traductionTargetBlank + '</span></a>';
                }
            }else{
                buildArtist += '<span class="artistNoLink">'+ artist +'</span>';
            }
            buildArtist += '</div>';
            return buildArtist;
        },

        /**
         * fait un appel ajax pour recuperer la liste des tracks recemment joue
         **/
        getRecentlyPlayed: function (callsign, itemsPerPage, current_page, urlService) {
            return $.ajax({
                method: 'GET',
                dataType:'json',
                url: urlService+"/callsign/"+callsign,
                data: {
                    pageSize : itemsPerPage,
                    page : current_page
                }
            });
        },

        pagePrecedente: function () {
            var self = this;

            if (current_page > 1) {
                current_page--;
                self.displayRecentlyPlayed(false);
                self.validerAffichagePaginationArrow(current_page);
                $('.pageNumber').text(current_page);
            }
        },

        pageSuivante: function () {
            var self = this;

            if (current_page < self.numPages()) {
                current_page++;
                self.displayRecentlyPlayed(false);
                self.validerAffichagePaginationArrow(current_page);
                $('.pageNumber').text(current_page);
            }
        },

        validerAffichagePaginationArrow: function(page){
            var self = this;

            if (page == 1) {
                $('.pagination-top .ico-prev').addClass('disabled');
                $('.pagination-bottom .ico-prev').addClass('disabled');
                $('.pagination-top .ico-next').removeClass('disabled');
                $('.pagination-bottom .ico-next').removeClass('disabled');
            } else  if (page == self.numPages()) {
                $('.pagination-top .ico-next').addClass('disabled');
                $('.pagination-bottom .ico-next').addClass('disabled');
                $('.pagination-top .ico-prev').removeClass('disabled');
                $('.pagination-bottom .ico-prev').removeClass('disabled');
            } else {
                $('.pagination-top .ico-prev').removeClass('disabled');
                $('.pagination-bottom .ico-prev').removeClass('disabled');
                $('.pagination-top .ico-next').removeClass('disabled');
                $('.pagination-bottom .ico-next').removeClass('disabled');
            }
            // comme dans tous les cas de navigation possible nous devons valider la pagination, on va toujours passer par ici
            // c'est le bon endroit pour éviter de la duplication de code. appel au refreshSlots pour rafraichir la pub a chaque clique de navigation
            // arrow-right / arrow-left / dropdown
            self.refreshSlots();
        },


        createDropDown: function () {
            var self = this;

            var $dropdown = "<button type='button' class='dropdown-opt btn btn-default dropdown-toggle current-page' data-toggle='dropdown' aria-expanded='false'>";
            $dropdown +=  "<span class='pageNumber'>1</span><span class='caret'></span></button>";

            $('.pagination-top').find('.btn-group').append($dropdown);
            $('.pagination-bottom').find('.btn-group').append($dropdown);

            var $listItems = "<ul class='dropdown-menu page-picker' role='menu'>";
            for(var i=1; i <= self.numPages() ; i++){
                $listItems += "<li>"+i+"</li>";
            }
            $listItems += "</ul>";
            $('.pagination-top').find('.btn-group').append($listItems);
            $('.pagination-bottom').find('.btn-group').append($listItems);
        },

        triggerDropDown: function(){
            var self    = this;

            $(".dropdown-menu li").on('click', function() {
                // supprimer le selected possible de la page d'avant pour etre sur d'avoir seulement un page selectionne
                $(".dropdown-menu.page-picker>li.selected").removeClass('selected');
                // ajouter la classe au nouvelle element selectionne
                $(this).addClass('selected');
                self.goToPageX();
            });
        },

        goToPageX: function () {
            var self = this;
            var pageTo = $(".dropdown-menu.page-picker>li.selected").text();
            current_page = pageTo;
            self.displayRecentlyPlayed(false);
            self.validerAffichagePaginationArrow(current_page);
            $('.pageNumber').text(current_page);
        },

        numPages: function () {
            return Math.ceil(totalItemsToShow / itemsPerPage);
        },

        refreshSlots : function(){
            Ad.prototype.refreshSlots.call();
        }
    });

    return RecentlyPlayed;
});
