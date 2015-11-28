var app=new function(){
	this.log=function(text){
		chrome.storage.local.get(function(items){
			chrome.storage.local.set({'log':(items['log']+text)});
		});
		chrome.runtime.sendMessage({'action':'log','text':text});
	}
	this.init=function(){
		app.page_type=document.body.className.split(' ')[0];//soccer|hockey|basketball|etc
						//Если не будет работать то className.split(' ').indexOf(type)
		console.log('Q',app.page_type);
		chrome.storage.local.get(function(items){
			console.log(items);
			app.debug=items.debug;
			app.date_start=new Date(items.date_start);
			app.date_end=new Date(items.date_end);
			
			if(items.status=="parser_first"){
				if(app.debug)console.log('Ready,go..');
				setTimeout(app.load_mathes,200);
			}
		});
	}
	this.load_mathes=function(){//Функция,разворачивающая страницу
		if(document.getElementById('preload').style.display=='none'){
			if(document.getElementsByClassName("link-more-games")[0].style.display!="none"){
				if(app.debug)console.log("Page not full..");
				var script=document.createElement("script");
				script.setAttribute("type","text/javascript");
				script.async=true;
				script.innerHTML="loadMoreGames();";
				document.body.appendChild(script);
				setTimeout(app.load_mathes,200);
			}else{
				if(app.debug)console.log('Page loaded');
				app.parsers[app.page_type]();
			}
		}else{
			if(app.debug)console.log("Page not loaded..");
			setTimeout(app.load_mathes,200);
		}
	}
	this.parsers={
		soccer:function(){
			var elements=document.getElementsByClassName("stage-finished");
			var rows=new Array();
			for(var i=0;i<elements.length;i++){
				var id=elements[i].id.split("g_1_")[1];
				var now_row=rows.length;
				for(var j=0;j<elements[i].childNodes.length;j++){
					var el=elements[i].childNodes[j];
					switch(el.className){
						case "cell_ad time ":
							var time=el.firstChild.nodeValue;
						break;				
						case "cell_ab team-home  bold ":case "cell_ab team-home ":
							var team_home=el.firstChild.firstChild.nodeValue;
							var red_card_home=0;
							for(var k=0;k<el.childNodes.length;k++){
								try{	
									if(el.childNodes[k].childNodes[1].className=="racard racard1"){
										red_card_home=1;
									}
									if(el.childNodes[k].childNodes[1].className=="racard racard2"){
										red_card_home=2;
									}
								}catch(e){
									console.error(e);
								}
							}
						break;
						case "cell_ac team-away  bold ":case "cell_ac team-away ":
							var team_away=el.firstChild.firstChild.nodeValue;
							var red_card_away=0;
							for(var k=0;k<el.childNodes.length;k++){
								try{	
									if(el.childNodes[k].childNodes[1].className=="racard racard1"){
										red_card_away=1;
									}
									if(el.childNodes[k].childNodes[1].className=="racard racard2"){
										red_card_away=2;
									}
								}catch(e){
									console.error(e);
								}
							}
						break;
						case "cell_sa score  bold ":
							var score=el.firstChild.nodeValue;
						break;
						//default:console.log(elements[i].childNodes[j].className);
					}
				}
				rows[now_row]={'is_parsed':'-','id':id,type:app.page_type,'time':time,'team_home':team_home,'red_card_home':red_card_home,'team_away':team_away,'red_card_away':red_card_away,'score':score}
				if(app.debug)console.log(rows[now_row]);
			}
			if(rows.length){
				chrome.runtime.sendMessage({
					'action':"data_parsed",
					data:rows,
					"name":document.title.replace("результаты ","")
				}, function(){
					if(!app.debug)window.close();
				});
			}else{
				app.log("Произошла ошибка! Не найдены матчи. Попробуйте заново");				
			}
		},
		hockey:function(){
			var tables=document.querySelectorAll('table.hockey')
			var rows=new Array();
			for(var lg=0;lg<tables.length;lg++){
				var league = tables[lg].querySelector('.name').innerText;
				var elements=tables[lg].getElementsByClassName("stage-finished");
				for(var i=0;i<elements.length;i++){
					var id=elements[i].id.split("g_4_")[1];
					for(var j=0;j<elements[i].childNodes.length;j++){
						var el=elements[i].childNodes[j],
							classess=el.className.split(' ');
							classess.constructor.prototype.has=function(value){
								return this.indexOf(value)!=-1;
							}
						switch(true){
							case classess.has("time"):
								var time=el.firstChild.nodeValue;
							break;				
							case classess.has("team-home"):
								var team_home=el.firstChild.firstChild.nodeValue;
							break;
							case classess.has("team-away"):
								var team_away=el.firstChild.firstChild.nodeValue;
							break;
							case classess.has("score"):
								var score=el.firstChild.nodeValue;
							break;
							//default:console.log(elements[i].childNodes[j].className);
						}
					}
					
					var date_match=time.split('.');
					var years=/[\w\W]+(\d{4,4})\/(\d{4,4})[\w\W]+/.exec(document.title);
					if(years && years.length==3){
						year=years[(date_match[1]>6)?1:2]
					}else{
						year=(new Date()).getFullYear();					
					}
					date_match=new Date(
						year+'-'+date_match[1]+'-'+date_match[0]
					);
					var match={
						'is_parsed':'-',
						id:id,
						type:app.page_type,//'hockey'..
						time:time,
						team_home:team_home,
						team_away:team_away,
						league:league,
						score:score,
						date_start:app.date_start,
						date_end:app.date_end
					}
					if(app.date_start<=date_match && app.date_end>=date_match){
						rows.push(match);
						if(app.debug)console.log(match);
					}else{
						if(app.debug)console.log(app.date_start,app.date_end,time,date_match,app.date_start<date_match,app.date_end>date_match);
					}
				}
				if(app.debug)console.log(league,rows,elements.length);
			}
			chrome.runtime.sendMessage({
				action:"data_parsed",
				data:rows,
				type:app.page_type,
				name:document.title.replace("результаты ","")
			}, function(){
				if(app.debug){
					console.log({
						action:"data_parsed",
						data:rows,
						type:app.page_type,
						name:document.title.replace("результаты ","")
					});
				}else{
					window.close();
				}
			});	
		},
		__hockey:function(){
			var elements=document.getElementsByClassName("stage-finished");
			var rows=new Array();
			if(app.debug)console.log(elements,elements.length);
			for(var i=0;i<elements.length;i++){
				var id=elements[i].id.split("g_4_")[1];
				for(var j=0;j<elements[i].childNodes.length;j++){
					var el=elements[i].childNodes[j],
						classess=el.className.split(' ');
						classess.constructor.prototype.has=function(value){
							return this.indexOf(value)!=-1;
						}
					switch(true){
						case classess.has("time"):
							var time=el.firstChild.nodeValue;
						break;				
						case classess.has("team-home"):
							var team_home=el.firstChild.firstChild.nodeValue;
						break;
						case classess.has("team-away"):
							var team_away=el.firstChild.firstChild.nodeValue;
						break;
						case classess.has("score"):
							var score=el.firstChild.nodeValue;
						break;
						//default:console.log(elements[i].childNodes[j].className);
					}
				}
				
				var date_match=time.split('.');
				var years=/[\w\W]+(\d{4,4})\/(\d{4,4})[\w\W]+/.exec(document.title);
				if(years && years.length==3){
					year=years[(date_match[1]>6)?1:2]
				}else{
					year=(new Date()).getFullYear();					
				}
				date_match=new Date(
					date_match[1]+'-'+date_match[0]+'-'+year
				);
				var match={
					'is_parsed':'-',
					id:id,
					type:app.page_type,//'hockey'..
					time:time,
					team_home:team_home,
					team_away:team_away,
					score:score,
					date_start:app.date_start,
					date_end:app.date_end
				}
				if(app.date_start<date_match && app.date_end>date_match){
					rows.push(match);
					if(app.debug)console.log(match);
				}else{
					if(app.debug)console.log(app.date_start,app.date_end,time,date_match,app.date_start<date_match,app.date_end>date_match);
				}
			}
			chrome.runtime.sendMessage({
				action:"data_parsed",
				data:rows,
				type:app.page_type,
				name:document.title.replace("результаты ","")
			}, function(){
				if(app.debug){
					console.log({
						action:"data_parsed",
						data:rows,
						name:document.title.replace("результаты ","")
					});
				}else{
					window.close();
				}
			});	
		}
	}
	chrome.runtime.onMessage.addListener(function(request,sender,callback){
		if(app.debug)console.log("Request:",request.action);
		switch(request.action){
			case "check":
				chrome.runtime.sendMessage({'action':'get_url_array',data:[{
					url:document.location.href,
					type:app.page_type
				}]});
			break;			
			//default:console.log("Unknown request!");
		}
	});
	return this;
}
window.onload=app.init;