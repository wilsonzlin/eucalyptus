import {Moment} from 'moment';
import React, {useCallback, useState} from 'react';
import Plot from 'react-plotly.js';
import {categoryIDStore, MTransactionsAnalysisPoint, service, tagIDStore} from '../../service/Service';
import {PrimaryButton} from '../../ui/Button/view';
import {ManagedDateTimeInput} from '../../ui/DateTimeInput/view';
import {Form} from '../../ui/Form/view';
import {ManagedIDInput} from '../../ui/IDInput/view';
import {Labelled} from '../../ui/Labelled/view';
import {Flex} from '../../ui/Layout/view';
import {OptionalView} from '../../ui/OptionalView/view';
import {goToRoute} from '../../ui/RouteLink/view';
import {useRoute} from '../../ui/RouteView/view';
import {Select} from '../../ui/Select/view';
import {InlineExpense} from '../../ui/Text/view';
import {Transactions} from '../../ui/Transactions/view';
import {assertDefined, assertExists, assertState, UnreachableError} from '../../util/Assert';
import {JMap} from '../../util/JMap';
import {encodeQuery} from '../../util/QueryString';
import {useServiceFetch} from '../../util/ServiceFetch';

export type ExplorerParameters = {
  from?: Moment;
  to?: Moment;
  category?: number[];
  tag?: number[];
};

const enum Chart {
  PIE,
  LINE,
  HORIZONTAL_BAR,
  VERTICAL_BAR,
  AREA,
}

const plotlyChartType = (chart: Chart): 'pie' | 'scatter' | 'bar' | undefined => {
  switch (chart) {
  case Chart.PIE:
    return 'pie';
  case Chart.LINE:
    return 'scatter';
  case Chart.HORIZONTAL_BAR:
  case Chart.VERTICAL_BAR:
    return 'bar';
  case Chart.AREA:
    return undefined;
  default:
    throw new UnreachableError(chart);
  }
};


const CHART_OPTIONS = [
  {value: Chart.AREA, label: 'Area'},
  {value: Chart.HORIZONTAL_BAR, label: 'Bar (horizontal)'},
  {value: Chart.VERTICAL_BAR, label: 'Bar (vertical)'},
  {value: Chart.LINE, label: 'Line'},
  {value: Chart.PIE, label: 'Pie'},
];

const enum Group {
  NONE = 'none',
  YEAR = 'year',
  MONTH = 'month',
  DAY = 'day',
}

const GROUP_OPTIONS = [
  {value: Group.NONE, label: 'Do not group'},
  {value: Group.YEAR, label: 'Group by year'},
  {value: Group.MONTH, label: 'Group by month'},
  {value: Group.DAY, label: 'Group by day'},
];

const enum Split {
  NONE = 'none',
  CATEGORY = 'category',
}

const SPLIT_OPTIONS = [
  {value: Split.NONE, label: 'Do not split'},
  {value: Split.CATEGORY, label: 'Split by category'},
];

const categoryChartName = (category: string | null) => category ?? 'No category';

const maybeRenderChart = (chart: Chart, analysis: MTransactionsAnalysisPoint[] | undefined) => {
  if (!analysis) {
    return null;
  }
  if (!analysis.length) {
    return (
      <div>No data to display.</div>
    );
  }
  // WARNING: Use strict equality as value could be null.
  const hasCategory = analysis[0].category_name !== undefined;
  const hasTimeUnit = analysis[0].time_unit !== undefined;
  if (!hasCategory && !hasTimeUnit) {
    assertState(analysis.length === 1);
    return (
      <div>
        <InlineExpense cents={analysis[0].combined_amount}/>
      </div>
    );
  }
  if (chart == Chart.PIE && (!hasCategory || hasTimeUnit)) {
    // The chart type has been changed but the data hasn't been updated yet and is still loading.
    return null;
  }

  const timeUnits = [...new Set(analysis.map(pt => pt.time_unit))];
  const categories = [...new Set(analysis.map(pt => pt.category_name))];
  // timeUnit => category => amount.
  const data = new JMap<string | undefined, JMap<string | null | undefined, number>>();
  for (const pt of analysis) {
    data.computeIfAbsent(pt.time_unit, () => new JMap()).put(pt.category_name, pt.combined_amount);
  }

  const xProp = chart == Chart.PIE ? 'labels' : chart == Chart.HORIZONTAL_BAR ? 'y' : 'x';
  const yProp = chart == Chart.PIE ? 'values' : chart == Chart.HORIZONTAL_BAR ? 'x' : 'y';
  const type = plotlyChartType(chart);
  const traces = hasTimeUnit ? categories.map(c => ({
    [xProp]: timeUnits.map(assertExists),
    [yProp]: timeUnits.map(tu => data.getOrThrow(tu).getOrDefault(c, 0) / 100),
    stackgroup: 'amount',
    orientation: chart == Chart.HORIZONTAL_BAR ? 'h' as const : undefined,
    name: hasCategory ? categoryChartName(assertDefined(c)) : undefined,
    type,
  })) : [{
    [xProp]: categories.map(c => categoryChartName(assertDefined(c))),
    [yProp]: categories.map(c => data.getOrThrow(undefined).getOrThrow(c) / 100),
    stackgroup: 'amount',
    orientation: chart == Chart.HORIZONTAL_BAR ? 'h' as const : undefined,
    type,
  }];

  return (
    <Plot
      data={traces}
      layout={{
        width: Math.max(500, document.documentElement.clientWidth * 0.9),
        [`${xProp}axis`]: {
          type: 'category',
        },
        [`${yProp}axis`]: {
          tickformat: '$,.2f',
        },
        barmode: 'stack',
      }}
    />
  );
};

export const Explorer = ({}: {}) => {
  const params: ExplorerParameters | undefined = useRoute('/explorer?from=from:d&to=to:d&category=category:i[]&tag=tag:i[]');

  const submitHandler = useCallback((params: ExplorerParameters) => {
    goToRoute(`/explorer${encodeQuery(params)}`);
  }, []);

  const [chart, setChart] = useState<Chart>(Chart.VERTICAL_BAR);
  const [group, setGroup] = useState<Group>(Group.MONTH);
  const [split, setSplit] = useState<Split>(Split.CATEGORY);

  const {data: analysisPoints, loading: loadingAnalysisPoints} = useServiceFetch<MTransactionsAnalysisPoint[] | undefined>({
    fetcher: async () => params && (await service.getTransactionsAnalysis({
      from: params.from,
      to: params.to,
      splitBy: chart == Chart.PIE ? Split.CATEGORY : split,
      timeUnit: chart == Chart.PIE ? Group.NONE : group,
      categories: params.category,
      tags: params.tag,
    })).analysis,
    defaultValue: undefined,
    dependencies: [params, chart, group, split],
  });

  return (
    <OptionalView props={params}>
      {props => (
        <>
          <Form onSubmit={submitHandler}>
            {form => (
              <>
                <Labelled label="From">
                  <ManagedDateTimeInput name="from" form={form} initialValue={params.from}/>
                </Labelled>
                <Labelled label="To">
                  <ManagedDateTimeInput name="to" form={form} initialValue={params.to}/>
                </Labelled>
                <Labelled label="Categories">
                  <ManagedIDInput name="category" form={form} idStore={categoryIDStore} multiple={true} initialValue={params.category ?? []}/>
                </Labelled>
                <Labelled label="Tags">
                  <ManagedIDInput name="tag" form={form} idStore={tagIDStore} multiple={true} initialValue={params.tag ?? []}/>
                </Labelled>
                <PrimaryButton submit={true}>Explore</PrimaryButton>
              </>
            )}
          </Form>
          <Flex>
            <Labelled label="Chart">
              <Select options={CHART_OPTIONS} value={chart} onChange={setChart}/>
            </Labelled>
            <Labelled label="Group">
              <Select options={GROUP_OPTIONS} value={group} onChange={setGroup} disabled={chart == Chart.PIE}/>
            </Labelled>
            <Labelled label="Split">
              <Select options={SPLIT_OPTIONS} value={split} onChange={setSplit} disabled={chart == Chart.PIE}/>
            </Labelled>
          </Flex>
          <Flex space="around" overflow="auto">
            {maybeRenderChart(chart, loadingAnalysisPoints ? undefined : analysisPoints)}
          </Flex>
          <Transactions
            from={props.from}
            to={props.to}
            categories={props.category}
            tags={props.tag}
          />
        </>
      )}
    </OptionalView>
  );
};
