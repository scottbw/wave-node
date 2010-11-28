/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function replaceTextSmileys(text)
{
    // ***add textual emoticons to the array below
    var textSmileys = new Array(
        ":)",
        ":(",
        ";)",
        ":D",
        ":P",

        ":-)",
        ":-(",
        ";-)",
        ":-D",
        ":-P",
        
        "(beer)",
        "<3",
        "(moon)",
        "O_o"
        );
    // *** add the url's from the corresponding images below
    var realSmileys = new Array(
        "smileys/smile.png",
        "smileys/frown.png",
        "smileys/wink.png",
        "smileys/grin2.png",
        "smileys/tongue.png",
        
        "smileys/smile.png",
        "smileys/frown.png",
        "smileys/wink.png",
        "smileys/grin2.png",
        "smileys/tongue.png",
        
        "smileys/beer.png",
        "smileys/heart.png",
        "smileys/ass.png",
        "smileys/O_o.png"
        );
   
    var indx;
    var smiley;
    var replacement;
    
    for ( var n = 0 ; n < textSmileys.length; n++ ){ 
            replacement = '';
            indx = text.indexOf(textSmileys[n]);
            if (indx != -1){
                smiley = '<img src=\"' + realSmileys[n] + '">'
                replacement = text.replace(textSmileys[n],smiley);
                text = replacement;              
            }    
    }
                    
    return text;                 
 
    } 
