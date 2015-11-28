var app=new function(){
	this.log=function(text){
		chrome.storage.local.get(function(items){
			chrome.storage.local.set({'log':(items['log']+text)});
		});
		chrome.runtime.sendMessage({'action':'log','text':text});
	}
	this.init=function(){
		app.page_type=document.body.className.split(' ')[0];
		console.log('Q',app.page_type);
		chrome.storage.local.get(function(items){
			app.debug=items.debug;
			if(items.status=="collect_times" || items.status=="pause" || items.status=="stop"){
				app.parsers[app.page_type]();
			}//else app.parsers[app.page_type]();
		});
	}
	this.parsers={
		soccer:function(){
			if(document.getElementsByClassName("p1_home")[0] && document.getElementsByClassName("mstat-date")[0]){
				id=document.location.href.split("/match/")[1].split("/")[0];
				//Первый тайм
				score=document.getElementsByClassName("p1_home")[0].firstChild.nodeValue+":"+document.getElementsByClassName("p1_away")[0].firstChild.nodeValue;
				
				date=document.getElementsByClassName("mstat-date")[0].firstChild.nodeValue;
				document.location.href=document.location.href.replace("match-summary","player-statistics");
				app.tt=setInterval(function(){
					if(document.getElementById("player-statistics-preload").style.display=="none"){							
						clearInterval(app.tt);
						try{
							var table_home=document.getElementById("tab-player-statistics-1-statistic");
							var table_away=document.getElementById("tab-player-statistics-2-statistic");
							if(table_home && table_away){
								table_home=table_home.firstChild.childNodes[1];
								table_away=table_away.firstChild.childNodes[1];														
								goal_away="N";
								goal_home="N";
								for(var i=0;i<table_home.childNodes.length;i++){//Перебор строк таблицы
									if(table_home.childNodes[i].childNodes[2].firstChild.nodeValue>1){
										goal_home="Y";
										break;
									}
								}
								for(var i=0;i<table_away.childNodes.length;i++){//Перебор строк таблицы
									if(table_away.childNodes[i].childNodes[2].firstChild.nodeValue>1){
										goal_away="Y";
										break;
									}
								}
							}else{
								goal_away="No info";
								goal_home="No info";
							}
						}catch(e){
							console.log(e.stack);
							goal_away="No info";
							goal_home="No info";
						}
					//	console.log({id:id,score:score,date:date,goal_home:goal_home,goal_away:goal_away});
						chrome.runtime.sendMessage({'action':"match_parsed",data:{id:id,score:score,date:date,goal_home:goal_home,goal_away:goal_away,type:'soccer'}});
					}
				},500);
			}else{
				document.location.href=document.location.href.split("#")[0]+"#match-summary";
			}
		},
		hockey:function(){
			var url_root=document.location.href.split("#");
			if(url_root[1].split(';')[0]!='match-summary'){
				document.location.href=url_root[0]+'#match-summary';
			}
			var url_root=url_root[0];
			var match={
				id:document.location.href.split("/match/")[1].split("/")[0],
				type:app.page_type,
				data:[]
			}
			app.tt=setInterval(function(){
				var table=document.getElementById('parts');
				var trs=table?table.getElementsByTagName('tr'):false;
				if(trs){
					clearInterval(app.tt);
					match.date=document.getElementsByClassName("mstat-date")[0].firstChild.nodeValue;
					var period=0;
					for(var i=0;i<trs.length && period<=3;i++){
						var tr=trs[i];
						if(tr.className.indexOf('stage-header')!=-1){
							period++;
							match.data[period]=[];
							continue;
						}else{
							var t=tr.getElementsByClassName("icon-box hockey-ball");
							if(t.length){
								var time=tr.getElementsByClassName("time-box-wide")[0];
								match.data[period].push({
									'team':time.parentNode.parentNode.className.indexOf('fl')==-1?2:1,
									'time':time.innerHTML
								})
							}
						}
					}
					
					if(true || app.debug){
						console.log(match);
						app.log('Матч '+match.id+' готов,собрано '+match.data.length+' периодов\n');
					}
					chrome.runtime.sendMessage({'action':"match_parsed",data:match});
				}else{
					if(app.debug)console.log('not loaded',document.getElementById("preload-all").className);
				}
			},200);
		},
		__hockey:function(){
			var url_root=document.location.href.split("#");
			if(url_root[1].split(';')[0]!='match-statistics'){
				document.location.href=url_root[0]+'#match-statistics;0';
			}
			var url_root=url_root[0];
			var match={
				id:document.location.href.split("/match/")[1].split("/")[0],
				type:app.page_type,
				data:[]
			}
			app.tt=setInterval(function(){
				var tables=document.querySelectorAll('#tab-match-statistics .parts');
				if(document.getElementById("statistics-content").childNodes.length && tables){
					clearInterval(app.tt);
					match.date=document.getElementsByClassName("mstat-date")[0].firstChild.nodeValue;
					match.after=document.getElementsByClassName("mstat")[0].firstChild.nodeValue;
					for(var i=0;i<tables.length;i++){
						var table=tables[i];
						if(!table){
							console.log('#tab-statistics-'+i+'-statistic .parts',table,document.querySelector('#tab-statistics-'+i+'-statistic .parts'));
//							if(i!=4)return;
							break;//Бывают матчи без овертайма например
						}
//						if(app.debug)console.log(i,table.childNodes.length,table);
						try{
							if(table.childNodes.length==1)table=table.firstChild;//tbody
							var t={}
							for(var j=0;j<table.childNodes.length;j++){
								var home=table.childNodes[j].querySelector('.fl').innerText
								var away=table.childNodes[j].querySelector('.fr').innerText
								var name=table.childNodes[j].querySelector('.stats').innerText;
								t[name]={
									home:home,
									away:away
								}
							}
							match.data[i]=t;
						}catch(e){
							console.error(e);
						}
					}
					if(app.debug){
						console.log(match);
						app.log('Матч '+match.id+' готов,собрано '+match.data.length+' периодов\n');
					}
					chrome.runtime.sendMessage({'action':"match_parsed",data:match});
				}else{
					if(app.debug)console.log('not loaded',document.getElementById("preload-all").className);
				}
			},200);
		}
	}
}
window.onload=app.init;