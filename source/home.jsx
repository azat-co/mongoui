<div class="row-fluid">
  <h3>
    <small>{dbName}</small>{#if collectionName}.{collectionName}
    <a href="/api/dbs/{{dbName}}/collections/{collectionName}.json" target="_blank" class="raw ">
      <span class="badge badge-info">(raw)
      </span>
    </a>
    {/if}
  </h3>
</div>
<div class="row-fluid">
  <form class="form-horizontal well" x-bind="submit: applyFilter">


<!--         <select class="input-small">
        <option value="find">find</option>
        <option value="remove">remove</option>
      </select>
-->
    <legend class="inline">Filter<small>always case-sensitive</small></legend>
    {#each query}
    <div class="control-group key-value-group">
      <label class="control-label" for="query-key">Key: Value</label>
      <div class="controls key-value-row">
        "<input class="text input-xlarge query-key" placeholder="name" value="{{key}}" />":&nbsp;
        <span class="query-value-wrapper-left">"</span>
        <input class="text input-xlarge query-value" data-type="{{type}}" placeholder="azat" value="{{value}}" x-bind="keyup: formEnter"/>
        <span class="query-value-wrapper-right">"</span>
        <label class="radio inline" x-bind="change: updateFilterType" >
          <input type="radio"  x-bind="change: updateFilterType" name="optionsRadios_{{key}}" id="optionsRadios_string_{{key}}" value="string" checked={{isString}}>
            String
        </label>
        <label class="radio inline">
          <input type="radio"  x-bind="change: updateFilterType" name="optionsRadios_{{key}}" id="optionsRadios2" value="number"
          checked={{isNumber}}>
            Number
        </label>
        &nbsp;&nbsp;
        <a class="btn btn-danger" x-bind="click: removeFilterRow">remove</a>
<!--           <label class="radio inline">
          <input type="radio" x-bind="change: updateFilterType"  name="optionsRadios" id="optionsRadios3" value="ID" >
            ID
        </label>  -->
      </div>

    </div>
    {/each}
    <div class="control-group key-value-group">
      <label class="control-label" for="query-key">Key: Value</label>
      <div class="controls key-value-row">
        "<input class="text input-xlarge query-key" placeholder="name"/>":&nbsp;
        <span class="query-value-wrapper-left">"</span><input class="text input-xlarge query-value" data-type="string" placeholder="azat"  x-bind="keyup: formEnter"/><span class="query-value-wrapper-right">"</span>
        <label class="radio inline" x-bind="change: updateFilterType">
          <input type="radio"  x-bind="change: updateFilterType" name="optionsRadios" id="optionsRadios1" value="string" checked>
            String
        </label>
        <label class="radio inline">
          <input type="radio"  x-bind="change: updateFilterType" name="optionsRadios" id="optionsRadios2" value="number" >
            Number
        </label>
<!--           <label class="radio inline">
          <input type="radio" x-bind="change: updateFilterType"  name="optionsRadios" id="optionsRadios3" value="ID" >
            ID
        </label>  -->
      </div>

    </div>
<!--       <div class="control-group">
      <label class="control-label" for="query-key">Key: Value</label>
      <div class="controls">
        "<input class="text" class="input-xlarge" id="query-key" placeholder="_id"/>":            "<input class="text" class="input-xlarge" id="query-value" placeholder="5061da1e63e785cc44017668"/>"
      </div>
    </div>
-->
    <div class="form-actions">
      <button type="button" class="btn btn-primary" x-bind="click: applyFilter">Apply</button>&nbsp;&nbsp;
      <button type="button" class="btn btn-success" x-bind="click: addKeyValueForm">One more key-value pair</button>&nbsp;&nbsp;
      <button type="button" class="btn btn-danger" x-bind="click: clearFilter">Clear</button>
    </div>
  </form>
</div>
  <div class="row-fluid">
<!--       <div class="span4">
      <span>
        List of databases:
      </span>


      <div>Database URL:
        <input value="{dbName}" placeholder="//localhost:27017/"/>
      </div>

      <div>Collections of <span><strong>{dbName}</strong></span>:
        {{#each collections}}
        <div>
          <a class="collection" x-bind="click: changeCollection" data-value="{{.name}}">
            {{.name}}
          </a>&nbsp;

        </div>
        {{/}}
      </div>


      Raw collections:
      <pre><code>{{collections}}</code></pre>

    </div> -->

    <div class="span12">
    <h3>Filter result</h3>
      <boot:tabs current="view">
        <boot:tab title="View" name="view">
          {#if queryResultHTML}
            <div class="span12">
              <div class="collection-box">
                <pre>
                  <code>
                    {{{unescaped queryResultHTML}}}
                  </code>
                </pre>
              </div>
            </div>
          {else}
            Please select a collection
          {/if}
        </boot:tab>

        {#if item}
          <boot:tab title="Edit: {{item._id}}" name="edit">
            <div >
              <!-- {{itemConverted}} -->
              {#each itemConverted}
                <div style="padding-left:{level}0px;" data-type="{type}" x-bind="click: showInput">
                  <span class="edit-row text">{key}:{.value}</span>
                  <div class="input hidden">
                    <input value="{.value}" type="text" x-bind="blur: cancelInput" data-path="{{path}}"/>
                    <!-- <a class="bth btn-warining" x-bind="click: cancelInput">x</a> -->
                  </div>
                </div>
              {/each}
            </div>
          </boot:tab>
        {/if}
      </boot:tabs>
   </div>


</div>
