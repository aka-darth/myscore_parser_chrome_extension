var app=window.app=new function(){
	/* Тут лежат вкладки с чемпионатами
	{
		id(tab),
		url,
		country,
		type,
		name(rus),
		file,
		{
			id(match),time,team_home,red_card_home,goal_home,team_away,red_card_away,goal_away,first_time,score
		}
	}
	*/
	this.tabs=[];
	this.work_tabs=[];
	this.tabs_work=new (function(){
		var ids=[];
		var self=this;
		this.check=function(){
			ids.forEach(function(id){
				if(exists){
					//
				}else{
					self.open();
				}
			});
		}
		return this;
	})();
	this.pause=0;
	
	var pause=false;
	this.debug=false;
	kill_tabs=0;
	//Установка переменных при первой загрузке приложения.
//	chrome.storage.local.clear();
	chrome.storage.local.set({'status':'ready'});	// ready parser_first collect_times pause file_generate Finish 
	chrome.storage.local.set({'threads':'7'});
	chrome.storage.local.set({'log':''});
	chrome.storage.local.set({'debug':this.debug});
	chrome.storage.local.get(function(storage){
		for(var i=0;i<storage.my_tabs.length;i++){
			storage.my_tabs[i].file=null;
		}
		chrome.storage.local.set({'my_tabs':storage.my_tabs});
	})
	this.log=function(text){
		chrome.storage.local.get(function(storage){
			chrome.storage.local.set({'log':(storage.log+text)});
			chrome.runtime.sendMessage({'action':'log'});
		});
	}
	this.get_next_url=function(){
		console.log(now_league,app.tabs.length,iterator,total);
									//
		if(app.tabs[now_league] && app.tabs[now_league].rows_array.length>iterator){//Следующий матч
			var url="http://www.myscore.ru/match/"+app.tabs[now_league].rows_array[iterator].id+"/#match-summary";
		}else if(app.tabs.length>++now_league){//Следующий чемпионат
			iterator=0;
			app.log(app.tabs[now_league-1].name+":Данные о матчах собраны.\n");
			var url="http://www.myscore.ru/match/"+app.tabs[now_league].rows_array[iterator].id+"/#match-summary";
		}else{//сбор окончен
			return false;
		}
		iterator++;
		console.log(url);
		return url;
	}
	Array.prototype.diff=function(array){
		var diff=[];
		for(var i=0;i<array.length;i++){
			if(diff.indexOf(array[i])==-1){
				diff.push(array[i]);
			}
		}
		return diff;
	}
	function save_tabs(){
		chrome.storage.local.get(function(storage){		
			if(storage.my_tabs){
				console.log('Tabs saved:'+storage.my_tabs.length+' new:'+app.tabs.length,'diff:',app.tabs.diff(storage.my_tabs))
				var my_tabs=[];
				for(var i=0;i<storage.my_tabs.length;i++){
					var founded=false;
					for(var j=0;j<app.tabs.length;j++){
						if(app.tabs[j].url==storage.my_tabs[i].url){
							if(app.tabs[j].parsed_rows>storage.my_tabs[i].parsed_rows){
								my_tabs[my_tabs.length]=app.tabs[j];
								founded=true;
								console.log('Data updated:'+app.tabs[j].name+"\nFrom "+storage.my_tabs[i].parsed_rows+" to "+app.tabs[j].parsed_rows);
							}else{
								console.log('Data not updated:'+app.tabs[j].name+"\nFrom "+storage.my_tabs[i].parsed_rows+" to "+app.tabs[j].parsed_rows);
							}
							app.tabs[j].saved=true;
							break;
						}
					}
					if(!founded){
						my_tabs[my_tabs.length]=storage.my_tabs[i];
					}
				}
				for(var j=0;j<app.tabs.length;j++){
					if(!app.tabs[j].saved){my_tabs[my_tabs.length]=app.tabs[j];}
				}
			}else{
				var my_tabs=app.tabs;
			}
			chrome.storage.local.set({'my_tabs':my_tabs});
		});
	}

	this.tabs_to_csv=function(){
		for(var i=0;i<app.tabs.length;i++){
			switch(app.tabs[i].type){
				case "soccer":{
					var data=";Название чемпионата;Дата матча;Время матча;Команда 1;Команда 2;Первый тайм Команда 1;Первый тайм Команда 2;Счет Команда 1;Счет Команда 2;Красные карты Команда 1; Красные карты Команда 2;Два и больше голов Команда 1;Два и больше голов Команда 2\r\n";
					for(var j=0;j<app.tabs[i].rows_array.length;j++){
						var date=app.tabs[i].rows_array[j].time.split(" ")[0];
						var time=app.tabs[i].rows_array[j].time.split(" ")[1];
						app.tabs[i].rows_array[j].score.replace(" ","");
						var score_1=app.tabs[i].rows_array[j].score.split(":")[0];
						var score_2=app.tabs[i].rows_array[j].score.split(":")[1];
						if(app.tabs[i].rows_array[j].first_time){
							app.tabs[i].rows_array[j].first_time.replace(" ","");
							var first_score_1=app.tabs[i].rows_array[j].first_time.split(":")[0];
							var first_score_2=app.tabs[i].rows_array[j].first_time.split(":")[1];
						}else{
							var first_score_1="-";
							var first_score_2="-";
						}
						if(!app.tabs[i].rows_array[j].goal_away){app.tabs[i].rows_array[j].goal_away="-";}
						if(!app.tabs[i].rows_array[j].goal_home){app.tabs[i].rows_array[j].goal_home="-";}
						data+='"'+app.tabs[i].rows_array[j].is_parsed+'";"'+app.tabs[i].name+'";"'+date+'";"'+time+'";"'+app.tabs[i].rows_array[j].team_home+'";"'+app.tabs[i].rows_array[j].team_away+'";"'+first_score_1+'";"'+first_score_2+'";"'+score_1+'";"'+score_2+'";"'+app.tabs[i].rows_array[j].red_card_home+'";"'+app.tabs[i].rows_array[j].red_card_away+'";"'+app.tabs[i].rows_array[j].goal_home+'";"'+app.tabs[i].rows_array[j].goal_away+'"\r\n';
					}
					data=new Blob(["\ufeff",[data]],{type:'text/csv'});
					var file=window.URL.createObjectURL(data);
					app.tabs[i].file=file;
					console.log(app.tabs[i].file+" generated");
				}break;
				case "__hockey":{
					console.log('Generate __hockey file');
					var period={
						0:'Основное время',
						1:'1-ый период',
						2:'2-ой период',
						3:'3-ий период',
						4:'овертайм'
					};
					var who={
						home:'Хозяева',
						away:'Гости',
						summ:'Итого'
					};
					var detail=[
						'Броски в створ ворот',
						'% реализов. бросков',
						'Блок-но ударов',
						'Отраженные броски',
						'% отраженных бросков',
						'Удаления',
						'Штрафное время',
						'Шайбы в большинстве',
						'Шайбы в меньшинстве',
						'% реализ. большинства',
						'% игры в меньшинстве',
						'Силовые приемы',
						'Выигр. вбрасывания',
						'Голы в пустые ворота'
					];
					var data=[
						"Номер матча",
//						"Ссылка на матч",
						"Дата матча",
						"Время матча",
						"Команда 1",
						"Команда 2",
						"Счёт команды 1",
						"Счёт команды 2",
						""
					].join(';');
					for(var _i in period){
						for(var _k=0;_k<detail.length;_k++){
							for(var _j in who){
								data+=';'+period[_i]+' '+who[_j]+' '+detail[_k];
							}
						}
					}
					data+='\r\n';
					for(var j=0;j<app.tabs[i].rows_array.length;j++){
						var row=app.tabs[i].rows_array[j];
						/*
						row[period][detail]={
							home:home,
							away:away
						}
						*/
						//console.log(row);
						var string=[
							row.id,//"Номер матча",
//							'http://www.myscore.ru/match/'+row.id,//"Ссылка на матч",
							row.date?row.date.split(' ')[0]:row.time.split(' ')[0],//"Дата матча",
							row.time.split(' ')[1],//"Время матча",
							row.team_home,//"Команда 1",
							row.team_away,//"Команда 2",
							row.score.split(':')[0],//"Счёт команды 1"
							row.score.split(':')[1],//"Счёт команды 2"
							row.after
						].join(';');
						for(var _i in period){
							if(row.data && row.data[_i]){
								//console.log(_i,row.data[_i]);
								for(var _k=0;_k<detail.length;_k++){
									var t=row.data[_i][detail[_k]];
									//console.log(detail[_k],t);
									if(t){
										for(var _j in who){
											if(_j=='summ'){
												switch(detail[_k]){
													case '% реализов. бросков':
													case '% отраженных бросков':
													case '% реализ. большинства':
													case '% игры в меньшинстве':
													try{
														var a=t.home.split('(')[1].split('/');
														var b=t.away.split('(')[1].split('/');
														t.summ=(100*(+a[0]+ +b[0])/(a[1].replace(')','')/1+b[1].replace(')','')/1)).toFixed(2)+'% ('+(+a[0]+ +b[0])+'/'+(a[1].replace(')','')/1+b[1].replace(')','')/1)+')';
													}catch(e){
														t.summ='==';
														console.error(e);
													}
													break;
													case 'Броски в створ ворот':
													case 'Блок-но ударов':
													case 'Отраженные броски':
													case 'Удаления':
													case 'Штрафное время':
													case 'Шайбы в большинстве':
													case 'Шайбы в меньшинстве':
													case 'Силовые приемы':
													case 'Выигр. вбрасывания':
													case 'Голы в пустые ворота':
														t.summ=+t.home + +t.away;
													break;
													default:
												}
											}
											string+=';'+t[_j];
										}
									}else{
										for(var _j in who){
											string+='; -- ';
										}
									}
									//console.log(detail[_k],row.data[_i][detail[_k]]);
								}
							}else{
								for(var _j in who){
									for(var _k=0;_k<detail.length;_k++){
										string+='; -- ';
									}
								}

							}
						}
						console.log(string);
						data+=string+'\r\n';
					}
					console.log(data);
					data=new Blob(["\ufeff",[data]],{type:'text/csv'});
					var file=window.URL.createObjectURL(data);
					app.tabs[i].file=file;
					console.log(app.tabs[i].file+" generated");
				}break;
				case "hockey":{
					console.log('Generate hockey file');
					var data=([
						"Номер матча",
						"Дата матча",
						"Команда 1",
						"Команда 2",
						"счет"
					].join(';'))+'\r\n';

					for(var j=0;j<app.tabs[i].rows_array.length;j++){
						var match=app.tabs[i].rows_array[j];
						console.log(match);
						var string='Начало;'+match.league+'\r\n'+[
							match.id,//"Номер матча",
//							'http://www.myscore.ru/match/'+row.id,//"Ссылка на матч",
							match.date?match.date:match.time,//"Дата матча",
							match.team_home,//"Команда 1",
							match.team_away,//"Команда 2"
							match.score,//"Команда 2"
						].join(';');
						data+=string+'\r\n';
						for(var l=0;l<match.data.length;l++){
							var p=match.data[l];
							switch(l){
								case 1:
									data+='Первый период\r\n';
								break;
								case 2:
									data+='Второй период\r\n';
								break;
								case 3:
									data+='Третий период\r\n';
								break;
								default:continue;
							}
							for(var k=0;k<p.length;k++)data+='команда '+p[k].team+';'+p[k].time+'\r\n';
						}
					}
					console.log(data);
					data=new Blob(["\ufeff",[data]],{type:'text/csv'});
					var file=window.URL.createObjectURL(data);
					app.tabs[i].file=file;
					console.log(app.tabs[i].file+" generated");
				}break;
				default:
					console.warn('Unknown type:',app.tabs[i]);
			}
		}
	}
	function generate_files(){
		chrome.storage.local.get(function(storage){
			if(storage.one_file==true){
				//todo: Разбор по типу шапки (совсем всё одним файлом не получится. Хотя..)
				var data=";Название чемпионата;Дата матча;Время матча;Команда 1;Команда 2;Первый тайм Команда 1;Первый тайм Команда 2;Счет Команда 1;Счет Команда 2;Красные карты Команда 1; Красные карты Команда 2;Два и больше голов Команда 1;Два и больше голов Команда 2\r\n";
				for(var i=0;i<tabs.length;i++){
					//data[data.length]=" ;"+tabs[i].name+"; ;"+tabs[i].county+"; ; ;"+tabs[i].rows_array.length+" матчей; ; ; ; ; ; ; \r\n";
					for(var j=0;j<tabs[i].rows_array.length;j++){
						var date=tabs[i].rows_array[j].time.split(" ")[0];
						var time=tabs[i].rows_array[j].time.split(" ")[1];
						tabs[i].rows_array[j].score.replace(" ","");
						var score_1=tabs[i].rows_array[j].score.split(":")[0];
						var score_2=tabs[i].rows_array[j].score.split(":")[1];
						if(tabs[i].rows_array[j].first_time){
							tabs[i].rows_array[j].first_time.replace(" ","");
							var first_score_1=tabs[i].rows_array[j].first_time.split(":")[0];
							var first_score_2=tabs[i].rows_array[j].first_time.split(":")[1];
						}else{
							var first_score_1="-";
							var first_score_2="-";
						}
						if(!tabs[i].rows_array[j].goal_away){tabs[i].rows_array[j].goal_away="-";}
						if(!tabs[i].rows_array[j].goal_home){tabs[i].rows_array[j].goal_home="-";}
						data+='"'+tabs[i].rows_array[j].is_parsed+'";"'+tabs[i].name+'";"'+date+'";"'+time+'";"'+tabs[i].rows_array[j].team_home+'";"'+tabs[i].rows_array[j].team_away+'";"'+first_score_1+'";"'+first_score_2+'";"'+score_1+'";"'+score_2+'";"'+tabs[i].rows_array[j].red_card_home+'";"'+tabs[i].rows_array[j].red_card_away+'";"'+tabs[i].rows_array[j].goal_home+'";"'+tabs[i].rows_array[j].goal_away+'"\r\n';
					}
				}
				data=new Blob(["\ufeff", [data]],{type:'text/csv'});
				var file=window.URL.createObjectURL(data);
				console.log(file+" generated");
				chrome.storage.local.set({"file":file});
			}else{
				app.tabs_to_csv();
			}
			save_tabs();
			chrome.runtime.sendMessage({'action':'file_maked',data:app.tabs});
		});
	}
	chrome.runtime.onMessage.addListener(function(request,sender,callback){
		console.log("Request:",request.action,request.data);
		switch(request.action){
			case "get_url_array":{
				//todo: check status
				chrome.storage.local.set({'status':'parser_first'});
				app.tabs=[];
				iterator=0;
				for(var i=0;i<request.data.length;i++){
					chrome.tabs.create({
						'url':request.data[i].url,
						'active':false
					},function(tab){
						console.log(tab);
						app.tabs.push({
							'id':tab.id,
							'parsed_rows':0,
							'url':tab.url,
	//						'country':tab.url.split("http://www.myscore.ru/football/")[1].split("/")[0]
						});
					});
				}				
			}
			break;
			case "data_parsed":{
				callback();
				iterator++;
				var rows_array=request.data;
				for(var i=0;i<app.tabs.length;i++){
					if(app.tabs[i].id==sender.tab.id){
						app.tabs[i].type=request.type;
						app.tabs[i].rows_array=rows_array;
						app.tabs[i].name=request.name;
					}
				}
				if(!request.name){
					//Не знаю от чего такие чудеса. Так что просто попробуем снова
					console.error(app.tabs,request,sender.tab.id);
					chrome.tabs.create({
						'url':sender.tab.url,
						'active':false
					},function(tab){
						console.log(tab);
						app.tabs.push({
							'id':tab.id,
							'parsed_rows':0,
							'url':tab.url,
	//						'country':tab.url.split("http://www.myscore.ru/football/")[1].split("/")[0]
						});
					});
					break;
				}
				if(iterator==app.tabs.length && rows_array.length){
					app.log("Всё ссылки обработаны!\nСобираю данные из детальной статистики матчей..\n");
					now_collected=0;
					now_league=0;
					iterator=0;
					chrome.storage.local.set({'status':'collect_times'});
					chrome.storage.local.get(function(storage){
						total=0;
						for(var i=0;i<app.tabs.length;i++){
							total+=app.tabs[i].rows_array.length;
						}
						chrome.runtime.sendMessage({'action':'progress','text':now_collected+"/"+total});
						for(var i=0;i<storage.threads;i++){
							var url=app.get_next_url();
							if(url){
								console.log(url);
								chrome.tabs.create({'url':url,'active':false},function(tab){
									app.work_tabs.push(tab.id);
								});
							}
						}
					});	
				}else{
					app.log("Всё ссылки обработаны.\nНе получено матчей!\n");
					chrome.storage.local.set({'status':'ready'});
				}
			}break;
			case "match_parsed":{
				if(!app.tabs){
					app.log("Данные исчезли!\n");
					break;
				}
				var founded=false;
				for(var i=0;i<app.tabs.length;i++){
					for(var j=0;j<app.tabs[i].rows_array.length;j++){
						if(request.data.id==app.tabs[i].rows_array[j].id){
							founded=true;
							app.tabs[i].parsed_rows++;
							switch(app.tabs[i].type){
								case "soccer":{
									app.tabs[i].rows_array[j].first_time=request.data.score;
									app.tabs[i].rows_array[j].time=request.data.date;
									app.tabs[i].rows_array[j].goal_home=request.data.goal_home;
									app.tabs[i].rows_array[j].goal_away=request.data.goal_away;
								}break;
								case "hockey":{
									app.tabs[i].rows_array[j].date=request.data.date;
									app.tabs[i].rows_array[j].after=request.data.after;
									app.tabs[i].rows_array[j].data=request.data.data;
								}break;
								default:
									console.log('Unknown',app.tabs[i])
							}
							app.tabs[i].rows_array[j].is_parsed="";
							break;
						}
					}
				}
				if(founded){
					now_collected++;
					chrome.runtime.sendMessage({'action':'progress','text':now_collected+"/"+total});
					if(now_collected>=total){
						chrome.storage.local.set({'status':'file_generate'});
						app.log("Все данные собраны,генерирую файлы..\n");
						generate_files();
						chrome.storage.local.set({'status':'ready'});
						if(!app.debug)chrome.tabs.remove(sender.tab.id);
					}else{
						if(kill_tabs>0){
							kill_tabs--;
							app.work_tabs.splice(app.work_tabs.indexOf(sender.tab.id),1);
							chrome.tabs.remove(sender.tab.id);
							break;
						}
						if(!pause){
							var url=app.get_next_url();
							if(url){
								try{
									chrome.tabs.update(sender.tab.id,{'url':url,'active':false});
								}catch(e){
									app.log('\n\nКритическая ошибка! Связь с вкладкой '+sender.tab.id+' утеряна')
								}
							}else{
								if(!app.debug)chrome.tabs.remove(sender.tab.id);								
							}
						}
					}
				}else{
					console.log('Получен запрос от неизвестной вкладки.');
				}
			}
			break;
			case "stop":{
				for(var i=0;i<app.work_tabs.length;i++){
					if(!app.debug)chrome.tabs.remove(app.work_tabs[i]);
				}
				app.work_tabs=[];
				chrome.storage.local.set({'status':'stop'});
				pause=true;
				generate_files();
			}
			break;
			case "window_pause":{
				if(!pause){
					chrome.storage.local.set({'status':'pause'});
					pause=true;
				}else if(iterator<total){
					chrome.storage.local.set({'status':'collect_times'});
					chrome.storage.local.get(function(storage){
						for(var i=0;i<storage.threads;i++){
							var url=app.get_next_url();
							if(i<app.work_tabs.length){
								chrome.tabs.update(app.work_tabs[i],{'url':url,'active':false});
							}else{
								chrome.tabs.create({'url':url,'active':false},function(tab){
									app.work_tabs[work_tabs.length]=tab.id
								});
							}
						}
					});
					pause=false;
				}else{
					console.log("Невозможно продолжить работу - матчи кончились");
				}			
			}
			break;
			case "update_threads":{
				chrome.storage.local.get(function(storage){
					if(storage.threads>app.work_tabs.length && storage.status=="collect_times"){
						for(var i=app.work_tabs.length;i<storage.threads;i++){
							var url=app.get_next_url();
							//todo: if url else
							chrome.tabs.create({'url':url,'active':false},function(tab){app.work_tabs[app.work_tabs.length]=tab.id});
						}
					}else if(storage.status=="collect_times" || storage.status=="pause"){
						kill_tabs=app.work_tabs.length-storage.threads;
					}
				});			
			}
			break;
			case "make_file":
				generate_files();
			break;
			case "log":case "progress":case "file_maked":break;
			case "reset":{
				chrome.storage.local.clear();
				chrome.storage.local.set({'status':'ready'});	// ready parser_first collect_times pause file_generate Finish 
				chrome.storage.local.set({'threads':'7'});
				chrome.storage.local.set({'log':''});
				chrome.storage.local.set({'debug':true});//Наверное траблы..
				callback();				
			}break;
			default:console.log("Unknown request!\n"+request.action);
		}
	});
	return this;
}
/*из манифеста
	"icons":{
		"16":"favicon-16.png",
		"32":"favicon-32.png",
		"64":"favicon-64.png",
		"128":"favicon-128.png" 
	},
*/