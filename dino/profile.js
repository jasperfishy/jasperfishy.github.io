export function normalizeName(value){if(typeof value!=='string')return null;const name=value.trim().replace(/\s+/g,' ');return [...name].length<=24&&(!name||/^[\p{L}\p{M}][\p{L}\p{M} '\u2019-]*$/u.test(name))?name:null;}
export function address(text,name){if(!name||text.startsWith(name+', '))return text;return name+', '+text.charAt(0).toLowerCase()+text.slice(1);}
