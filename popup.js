var app=new function(){
	this.progress_times=[];
	this.log=function(text){
		chrome.storage.local.get(function(storage){
			chrome.storage.local.set({'log':(storage.log+text)});
		});
		app.log_el.value+=text;
	}
	function show_files(){
		chrome.storage.local.get(function(storage){
			var html='';
			if(storage.file){
				html+='<a href="'+storage.file+'" download="all_data.csv">Скачать всё одним файлом</a><br>\n';
				document.getElementById("download").innerHTML=html;
			}
			for(var i=0;i<storage.my_tabs.length;i++){
				if(storage.my_tabs[i].file){
					html+='<a href="'+storage.my_tabs[i].file+'" download="'+storage.my_tabs[i].name+'.csv">Скачать '+storage.my_tabs[i].name+'.csv</a><br>\n';
					document.getElementById("download").innerHTML=html;
				}
			}
		});
	}

	this.init=function (){
		app.log_el=document.getElementById('log');
		document.getElementById('make_file_button').onclick=function (){
			app.log("Генерирую файлы для скачивания из уже имеющихся данных...\n");
			chrome.runtime.sendMessage({'action':'make_file'});
		}
		document.getElementById('pause_button').onclick=function (){
			chrome.runtime.sendMessage({'action':'window_pause'});
			if(document.getElementById('pause_button').value=="Пауза"){
				document.getElementById('pause_button').value="Продолжить";
			}else{
				document.getElementById('pause_button').value="Пауза";
				document.getElementById("progress_case").style.display="block";
			}
		}
		document.getElementById('stop_button').onclick=function (){
			chrome.runtime.sendMessage({'action':'stop'});
			document.getElementById("start_button").style.display="block";
			document.getElementById("pause_button").style.display="none";
			document.getElementById("progress_case").style.display="none";
			document.getElementById("make_file_button").style.display="none";
		}
		document.getElementById('clear_log_button').onclick=function (){
			chrome.storage.local.set({'log':''});
			app.log_el.value='';
		}
		document.getElementById('start_button').onclick=function (){
			document.getElementById("start_button").style.display="none";
			var input=document.getElementById('input');
			var text_to_log="Проверка..\n";
			if(input.value){
				var links=input.value.split("\n").map(function(link){return link.trim();});
				var valid_url=/^http:\/\/www\.myscore\.ru\/([-\w]+\/){1,3}results\//;
				var valid_links=new Array();
				for(var i=0;i<links.length;i++){
					if(valid_url.test(links[i])){
						valid_links.push({
							url:links[i]
						});
					}else{
						text_to_log+="Не валидная ссылка:'"+links[i]+"'\n";
					}
				}			
				if(valid_links.length){
					app.log(text_to_log+"Начинаю работу. Валидных ссылок - "+valid_links.length+".\nСобираю матчи со страниц..\n");
					chrome.runtime.sendMessage({'action':'get_url_array',data:valid_links});
				}else{
					app.log("Нет подходящих ссылок.\n");
				}
			}else{// Check this!!
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
					chrome.tabs.sendMessage(tabs[0].id,{'action':'check'},function(response){
						if(response){
							app.log('Собираю матчи из активной вкладки '+response+"\n");//??
						}else{
							app.log("Нет ответа от страниц. Вставьте ссылки или откройте вкладку с результатами игр.\n");
						}
					});
				});
			}
		}
		document.getElementById('input').onkeyup=function (){
			chrome.storage.local.set({'input':document.getElementById('input').value});
		}
		document.getElementById('threads').onchange=document.getElementById('threads').onkeyup=function (){
			i=parseInt(document.getElementById('threads').value);
			if(!isNaN(i)){
				chrome.storage.local.set({'threads':i});
				chrome.runtime.sendMessage({'action':'update_threads'});
			}
		}
		document.getElementById('date_start').onchange=function (){
			var end=document.getElementById('date_end');
			if(!end.value || (new Date(end.value)>new Date(this.value)))
				chrome.storage.local.set({'date_start':this.value});
			else
				end.value=this.value;
		}
		document.getElementById('date_end').onchange=function (){
			var end=document.getElementById('date_start');
			if(!end.value || (new Date(end.value)<new Date(this.value))){
				chrome.storage.local.set({'date_end':this.value});
			}else{
				end.value=this.value;
			}
		}
/*		document.getElementById('debug_mode').onchange=function (){
			chrome.storage.local.set({'debug':this.checked});
		}
*/		
		chrome.storage.local.get(function(storage){
			app.debug=storage.debug;
			//if(app.debug)document.getElementById('debug_mode').checked=true;
			app.log_el.value=storage.log;
			document.getElementById('input').value=storage.input?storage.input:'';
			document.getElementById('threads').value=storage.threads;
			document.getElementById('date_start').value=storage.date_start;
			document.getElementById('date_end').value=storage.date_end;
			if(storage.my_tabs){
				show_files();
			}
			switch(storage.status){
			// ready parser_first collect_times pause file_generate Finish 
				case "ready":
				case "Finish":
				case "stop":
					document.getElementById("start_button").style.display="block";
					document.getElementById("stop_button").style.display="none";
					document.getElementById("pause_button").style.display="none";
					document.getElementById("progress_case").style.display="none";
					document.getElementById("make_file_button").style.display="none";					
				break;
				case "pause":
					document.getElementById("start_button").style.display="none";
					document.getElementById("stop_button").style.display="block";
					document.getElementById("pause_button").style.display="block";
					document.getElementById('pause_button').value="Продолжить";
					document.getElementById("progress_case").style.display="none";
					document.getElementById("make_file_button").style.display="block";
				break;
				case "collect_times":
					document.getElementById("start_button").style.display="none";
					document.getElementById("stop_button").style.display="block";
					document.getElementById("pause_button").style.display="block";
					document.getElementById("progress_case").style.display="block";
					document.getElementById("make_file_button").style.display="block";
				break;
				case "file_generate":
					
				break;
				case "parser_first":
					document.getElementById("start_button").style.display="none";
					document.getElementById("stop_button").style.display="none";
					document.getElementById("pause_button").style.display="none";
					document.getElementById("progress_case").style.display="none";
					document.getElementById("make_file_button").style.display="none";					
				break;
				default:
					app.log("Произошла ошибка - неизвестный статус расширения ("+storage.status+") \n");
			}
		});
	}
	chrome.runtime.onMessage.addListener(
		function(request,sender,callback){
			switch(request.action){
				case "get_url_array":{
					app.log('Получено '+request.data.length+' ссылкок. Собираю ссылки на матчи..\n');
				}break;
				case "log":
					chrome.storage.local.get(function(items){
						app.log_el.value=items['log'];
					});
				break;
				case "data_parsed":
					app.log(request.name+" : "+request.data.length+" матчей\n");
					if(request.data.length){
						document.getElementById("stop_button").style.display="block";
						document.getElementById("make_file_button").style.display="block";						
					}else{
						document.getElementById("start_button").style.display="block";
						document.getElementById("stop_button").style.display="none";
						document.getElementById("pause_button").style.display="none";
						document.getElementById("progress_case").style.display="none";
						document.getElementById("make_file_button").style.display="none";
					}
				break;
				case "progress":
					app.progress_times.push(Date.now());
					if(app.progress_times.length>63){
						app.progress_times.shift();
					}
					var speed=(app.progress_times[app.progress_times.length-1]-app.progress_times[0])/(1000*app.progress_times.length);
					var s=request.text.split("/");
					var sec = Math.round(speed*(s[1]-s[0])) % 60;
					var min = (Math.round(speed*(s[1]-s[0])) - sec) / 60;
					document.getElementById('speedometer').innerHTML=(1/speed).toFixed(3)+' матчей/сек., осталось ~'+min+' мин. '+sec+' сек.';
					s=s[0]/s[1];
					document.getElementById("stop_button").style.display="block";
					document.getElementById("pause_button").style.display="block";
					document.getElementById("progress_case").style.display="block";
					document.getElementById("make_file_button").style.display="block";
					
					document.getElementById("progress_bar").firstChild.nodeValue=request.text;
					document.getElementById("progress_bar").style.width=(300*s)+"px";
				break;
				case "file_maked":
					try{
						var html='';
						for(var i=0;i<request.data.length;i++){
							html+='<a href="'+request.data[i].file+'" download="'+request.data[i].name+'.csv">Скачать '+request.data[i].name+'.csv</a><br>\n';
							document.getElementById("download").innerHTML=html;
						}
						document.getElementById("make_file_button").style.display="none";
					}catch(e){
						app.log("Ошибка при выдаче файла:"+e.stack);
					}
				break;
				case "match_parsed":break;
				default:console.log("Unknown request!\n"+request.action);
			}
		}
	);
	return this;
};
window.onload=app.init;