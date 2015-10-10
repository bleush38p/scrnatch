(function ($) {
  $.fn.scrnatch = function (projectid, options) {
    var v = this,
        activeTab = '';

    // DEFAULT OPTIONS
    var settings = $.extend({
      tabs: [
          'sprites',
          'costumes',
          'backgrounds',
          'sounds',
          'scripts'
        ],
        classes: {
          container_div: 'spr-container',
          container_div_type: [
            'spr-container-',
            ''
          ],
          tabs_ul: 'spr-tabs',
          tab_li: 'spr-tab',
          tab_active_li: 'spr-tab-active',
          fail_span: 'spr-fail',
          select_button: 'spr-select',
          layout: {
            _2_wide: 'spr-col2',
            _3_wide: 'spr-col3'
          },
          grid: {
            grid_ul: 'spr-grid',
            item_li: 'spr-griditem',
            item_active_li: 'spr-griditem-active'
          },
          preview_div: 'spr-preview',
          scratchblocks_pre: 'spr-scratchblocks'
        },
        proxy: [
          'https://cdn.assets.scratch.mit.edu/internalapi/asset/',
          '/get/'
        ]
      }, options);

    return new Promise(function(resolve, reject) {
      fetchProject(projectid).then(function (data) {
        render(data).then(resolve, function (fail) {
          v.append('<span class="' + settings.classes.fail_span + '">' + fail +  '</span>');
          reject(new Error("render error"));
        });
      }, function (fail) {
        v.append('<span class="' + settings.classes.fail_span + '">' + fail +  '</span>');
        reject(new Error("getJSON error"));
      });
    });



    function urlForAsset(assetmd5) {
      return settings.proxy[0] + assetmd5 + settings.proxy[1];
    }
    function fetchProject(id) {
      return new Promise(function(resolve, reject) {
      try{$.getJSON(
        'https://projects.scratch.mit.edu/internalapi/project/' + id + '/get/0'
      ).done(resolve).fail(function () {
        reject('Error: $.getJSON error. [Check the project id.]');
      });
      }finally{}});
    }

    function render(data) {
      return new Promise(function(resolve, reject) {
        try {
          // Add buttons
          var selectButton = $('<button disabled class="' + settings.classes.select_button + '" >Select</button>');
          v.append(selectButton);

          // Add tabs
          var tabs = [];
          for (var i = 0; i < 5; i++) {
            var thisTab = ['sprites', 'costumes', 'backgrounds', 'sounds', 'scripts'][i];
            if ($.inArray(thisTab, settings.tabs) > -1) {
              tabs.push(thisTab);
            }
          }
          if (tabs.length === 0) {
            reject('Error: at least one tab must be selected.');
            return;
          }
          if (tabs.length > 1) {
            var tabsUL = $('<ul class="' + settings.classes.tabs_ul +'">');
            for (var i = 0; i < tabs.length; i++) {
              tabsUL.append(
                $('<li class="' + settings.classes.tab_li + '" data-tab="' + tabs[i] + '">' +
                    '<a href="#">' + tabs[i] + '</a></li>')
              );
            }
            selectButton.before(tabsUL.on('click', '.' + settings.classes.tab_li.split(' ')[0], function () {
              if (activeTab === $(this).attr('data-tab')) return;
              v.find('.' + settings.classes.tab_li.split(' ')[0]).removeClass(settings.classes.tab_active_li);
              $(this).addClass(settings.classes.tab_active_li);
              activeTab = $(this).attr('data-tab');
              activateTab(data, resolve, reject);
            }));
            v.find('[data-tab=' + tabs[0] + ']').addClass(settings.classes.tab_active_li);
          }
          selectButton.before(
            $('<div class="' + settings.classes.container_div + '">')
          );
          activeTab = tabs[0];
          activateTab(data, resolve, reject);
        } catch (err) {
          reject(err);
        }
      });
    }

    function activateTab(data, resolve, reject) {
      try {
        var $container = v.find('.' + settings.classes.container_div.split(' ')[0]);
        $container.empty().attr('class', '')
          .addClass(settings.classes.container_div)
          .addClass(settings.classes.container_div_type[0] + activeTab + settings.classes.container_div_type[1]);
        v.find('.' + settings.classes.select_button.split(' ')[0]).attr('disabled', true).off('click');

        if (activeTab === 'backgrounds' || activeTab === 'sprites') {
          var $panes = [
            $('<div class="' + settings.classes.layout._2_wide + '">'),
            $('<div class="' + settings.classes.layout._2_wide + '">')
          ];

          var $grid = $('<ul class="' +  settings.classes.grid.grid_ul + '">');

          if (activeTab === 'backgrounds')
            data.costumes.forEach(function (background) {
              var $thisitem = $('<a href="#"><li class="' + settings.classes.grid.item_li + '">' +
                                 '<img src="' + urlForAsset(background.baseLayerMD5) + '">' +
                                 '<span></span>' +
                               '</li></a>'
                              ).attr('data-json', JSON.stringify(background));
              $thisitem.find('span').text(background.costumeName);
              $thisitem.click(function() {
                var $this = $(this);
                v.find('div:first-child > ul li').removeClass(settings.classes.grid.item_active_li);
                $this.find('li').addClass(settings.classes.grid.item_active_li);
                var $thispreview = $('<div class="' + settings.classes.preview_div + '">' +
                                      '<img src="' + $this.find('img').attr('src') + '">' +
                                      '<span></span>' +
                                     '</div>');
                $thispreview.find('span').text($this.find('span').text());
                $panes[1].empty().append($thispreview);
                v.find('.' + settings.classes.select_button.split(' ')[0]).removeAttr('disabled').click(function () {
                  resolve({type: 'background', data:JSON.parse($this.attr('data-json'))});
                });
              });
              $grid.append($thisitem);
            });

          else
            data.children.forEach(function (sprite) {
              try {var t = sprite.costumes[0]} catch (e) {return}
              var $thisitem = $('<a href="#"><li class="' + settings.classes.grid.item_li + '">' +
                                 '<img src="' + urlForAsset(sprite.costumes[sprite.currentCostumeIndex].baseLayerMD5) + '">' +
                                 '<span></span>' +
                               '</li></a>'
                              ).attr('data-json', JSON.stringify(sprite));
              $thisitem.find('span').text(sprite.objName);
              $thisitem.click(function() {
                var $this = $(this);
                v.find('div:first-child > ul li').removeClass(settings.classes.grid.item_active_li);
                $this.find('li').addClass(settings.classes.grid.item_active_li);
                data = JSON.parse($this.attr('data-json'));
                var $thispreview = $('<div class="' + settings.classes.preview_div + '">' +
                                      '<img src="' + $this.find('img').attr('src') + '">' +
                                      '<span></span>' +
                                     '</div>');
                $thispreview.find('span').text(
                  '' + data.objName + ' / ' +
                  data.costumes.length + ' costume' + (data.costumes.length > 1 ? 's / ' : ' / ') +
                  (data.scripts === undefined ? 'no scripts' : (data.scripts.length + ' script' + (data.scripts.length > 1 ? 's' : '')))
                );
                $panes[1].empty().append($thispreview);
                v.find('.' + settings.classes.select_button.split(' ')[0]).removeAttr('disabled').click(function () {
                  resolve({type: 'sprite', data:JSON.parse($this.attr('data-json'))});
                });
              });
              $grid.append($thisitem);
            });

          $panes[0].append($grid);
          $container.append($panes[0]).append($panes[1]);
        } else {
          var $panes = [
            $('<div class="' + settings.classes.layout._3_wide + '">'),
            $('<div class="' + settings.classes.layout._3_wide + '">'),
            $('<div class="' + settings.classes.layout._3_wide + '">')
          ];

          var $spritesgrid = $('<ul class="' +  settings.classes.grid.grid_ul + '">');

          var stageAndSprites = (activeTab === 'costumes' ? [] : [{
            objName: data.objName,
            scripts: data.scripts || [],
            sounds: data.sounds || [],
            costumes: data.costumes,
            currentCostumeIndex: data.currentCostumeIndex
          }]);

          data.children.forEach(function (child) {
            stageAndSprites.push(child);
          });

          stageAndSprites.forEach(function (sprite) {
            try {var t = sprite.costumes[0]} catch (e) {return}
            if (activeTab === 'sounds') try {var t = sprite.sounds[0]} catch (e) {return}
            if (activeTab === 'scripts') try {var t = sprite.scripts[0]} catch (e) {return}
            var $thisitem = $('<a href="#"><li class="' + settings.classes.grid.item_li + '">' +
                               '<img src="' + urlForAsset(sprite.costumes[sprite.currentCostumeIndex].baseLayerMD5) + '">' +
                               '<span></span>' +
                             '</li></a>'
                            ).attr('data-json', JSON.stringify(sprite))
            $thisitem.find('span').text(sprite.objName);
            $thisitem.click(function() {
              var $this = $(this);
              $panes[0].find('li').removeClass(settings.classes.grid.item_active_li);
              $this.find('li').addClass(settings.classes.grid.item_active_li);
              spriteObj = JSON.parse($this.attr('data-json'));

              var $mediaGrid = $('<ul class="' +  settings.classes.grid.grid_ul + '">');
              $panes[2].empty();
              v.find('.' + settings.classes.select_button.split(' ')[0]).attr('disabled', true);

              if (activeTab === 'costumes')
                spriteObj.costumes.forEach(function (background) {
                  var $thisitem = $('<a href="#"><li class="' + settings.classes.grid.item_li + '">' +
                                     '<img src="' + urlForAsset(background.baseLayerMD5) + '">' +
                                     '<span></span>' +
                                   '</li></a>'
                                  ).attr('data-json', JSON.stringify(background));
                  $thisitem.find('span').text(background.costumeName);
                  $thisitem.click(function() {
                    var $this = $(this);
                    $panes[1].find('li').removeClass(settings.classes.grid.item_active_li);
                    $this.find('li').addClass(settings.classes.grid.item_active_li);
                    var $thispreview = $('<div class="' + settings.classes.preview_div + '">' +
                                          '<img src="' + $this.find('img').attr('src') + '">' +
                                          '<span></span>' +
                                         '</div>');
                    $thispreview.find('span').text($this.find('span').text());
                    $panes[2].empty().append($thispreview);
                    v.find('.' + settings.classes.select_button.split(' ')[0]).removeAttr('disabled').click(function () {
                      resolve({type: 'costume', data:JSON.parse($this.attr('data-json'))});
                    });
                  });
                  $mediaGrid.append($thisitem);
                });
              if (activeTab === 'sounds')
                spriteObj.sounds.forEach(function (sound) {
                  var $thisitem = $('<a href"#"><li class="' + settings.classes.grid.item_li + '">' +
                                     '<audio controls="play">' +
                                       '<source src="' + urlForAsset(sound.md5) + '" type="audio/wav" />' +
                                       'NO AUDIO SUPPORT' +
                                     '</audio>' +
                                     '<span></span>' +
                                   '</li></a>').attr('data-json', JSON.stringify(sound));
                  $thisitem.find('span').text(sound.soundName);
                  $thisitem.click(function() {
                    var $this = $(this);
                    $panes[1].find('li').removeClass(settings.classes.grid.item_active_li);
                    $this.find('li').addClass(settings.classes.grid.item_active_li);
                    var $thispreview = $('<div class="' + settings.classes.preview_div + '">' +
                                          '<audio controls="play">' +
                                            '<source src="' + urlForAsset(sound.md5) + '" type="audio/wav" />' +
                                            'NO AUDIO SUPPORT' +
                                          '</audio>' +
                                          '<span></span>' +
                                         '</div>');
                    $thispreview.find('span').text($this.find('span').text());
                    $panes[2].empty().append($thispreview);
                    v.find('.' + settings.classes.select_button.split(' ')[0]).removeAttr('disabled').click(function () {
                      resolve({type: 'sound', data:JSON.parse($this.attr('data-json'))});
                    });
                  });
                  $mediaGrid.append($thisitem);
                });
              if (activeTab === 'scripts')
                spriteObj.scripts.forEach(function (script) {
                  var $thisitem = $('<a href="#"><li class="' + settings.classes.grid.item_li + '">' +
                                     '<pre class="' + settings.classes.scratchblocks_pre + '"></pre>' +
                                    '</li></a>').attr('data-json', JSON.stringify(script));
                  $thisitem.find('pre').text(scratchblocks2.gen(script));
                  $thisitem.click(function() {
                    var $this = $(this);
                    $panes[1].find('li').removeClass(settings.classes.grid.item_active_li);
                    $this.find('li').addClass(settings.classes.grid.item_active_li);
                    var $thispreview = $('<div class="' + settings.classes.preview_div + '">' +
                                          '<pre class="' + settings.classes.scratchblocks_pre + '"></pre>' +
                                         '</div>');
                    $thispreview.find('pre').text(scratchblocks2.gen(script));
                    $panes[2].empty().append($thispreview);
                    scratchblocks2.parse('.' + settings.classes.preview_div.split(' ')[0] + ' .' + settings.classes.scratchblocks_pre.split(' ')[0]);
                    v.find('.' + settings.classes.select_button.split(' ')[0]).removeAttr('disabled').click(function () {
                      resolve({type: 'script', data:JSON.parse($this.attr('data-json'))});
                    });
                  });
                  $mediaGrid.append($thisitem);
                });
              $panes[1].empty().append($mediaGrid);
              if (activeTab === 'scripts') scratchblocks2.parse('.' + settings.classes.scratchblocks_pre.split(' ')[0]);
            }); // once clicked, for each costume/sound/script
            $spritesgrid.append($thisitem);
          }); // for each stage/sprite
          $panes[0].append($spritesgrid);
          $container.append($panes[0]).append($panes[1]).append($panes[2]);
        }
      } catch (err) {
        reject(err);
      }
    }
  };
})(jQuery);
