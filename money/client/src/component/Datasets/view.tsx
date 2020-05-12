import React, {useCallback, useState} from 'react';
import {MDataset, MDatasetSource, service} from '../../service/Service';
import {InfoAlert, MaybeErrorAlert} from '../../ui/Alert/view';
import {PrimaryButton, SecondaryButton} from '../../ui/Button/view';
import {Dialog} from '../../ui/Dialog/view';
import {DialogFooter} from '../../ui/DialogFooter/view';
import {ManagedFileInput} from '../../ui/FileInput/view';
import {Form} from '../../ui/Form/view';
import {Labelled} from '../../ui/Labelled/view';
import {Flex} from '../../ui/Layout/view';
import {ManagedRadioGroup} from '../../ui/RadioGroup/view';
import {RouteLink} from '../../ui/RouteLink/view';
import {RouteView} from '../../ui/RouteView/view';
import {DateTime, Heading} from '../../ui/Text/view';
import {ManagedTextInput} from '../../ui/TextInput/view';
import {useServiceFetch} from '../../util/ServiceFetch';
import styles from './style.css';

export const Datasets = ({}: {}) => {
  const {data: datasets, refresh: refreshDatasets} = useServiceFetch<MDataset[]>({
    fetcher: () => service.getDatasets().then(({datasets}) => datasets),
    initial: [],
    dependencies: [],
  });

  const {data: datasetSources, refresh: refreshDatasetSources} = useServiceFetch<MDatasetSource[]>({
    fetcher: () => service.getDatasetSources().then(({sources}) => sources),
    initial: [],
    dependencies: [],
  });

  const [addDatasetDialogOpen, setAddDatasetDialogOpen] = useState<boolean>(false);
  const [addDatasetDialogError, setAddDatasetDialogError] = useState<string>('');
  const addDatasetHandler = useCallback(async (opt) => {
    try {
      await service.createDataset(opt);
      refreshDatasets();
      setAddDatasetDialogOpen(false);
    } catch (e) {
      setAddDatasetDialogError(e.message);
    }
  }, []);

  const [addDatasetSourceDialogOpen, setAddDatasetSourceDialogOpen] = useState<boolean>(false);
  const [addDatasetSourceDialogError, setAddDatasetSourceDialogError] = useState<string>('');
  const addDatasetSourceHandler = useCallback(async (opt) => {
    try {
      await service.createDatasetSource(opt);
      refreshDatasetSources();
      setAddDatasetSourceDialogOpen(false);
    } catch (e) {
      setAddDatasetSourceDialogError(e.message);
    }
  }, []);

  return (
    <RouteView route="/datasets">
      {() => (
        <div>
          <Heading>Datasets</Heading>
          <div className={styles.menu}>
            <SecondaryButton onClick={() => setAddDatasetDialogOpen(true)}>Add dataset</SecondaryButton>
          </div>
          <div>
            {datasets.map(({id, source_name, created, comment}) => (
              <div key={id}>
                <div>{source_name}</div>
                <div><DateTime timestamp={created}/></div>
                <div>{comment}</div>
                <RouteLink path={`/dataset/${id}`}>View</RouteLink>
              </div>
            ))}
          </div>

          <Dialog open={addDatasetDialogOpen} title="Add dataset">
            {!datasetSources.length ? (
              <>
                <InfoAlert>You need at least one dataset source to add a dataset.</InfoAlert>
                <DialogFooter>
                  <PrimaryButton onClick={() => setAddDatasetSourceDialogOpen(true)}>Add source</PrimaryButton>
                  <SecondaryButton onClick={() => setAddDatasetDialogOpen(false)}>Cancel</SecondaryButton>
                </DialogFooter>
              </>
            ) : (
              <>
                <MaybeErrorAlert>{addDatasetDialogError}</MaybeErrorAlert>
                <SecondaryButton onClick={() => setAddDatasetSourceDialogOpen(true)}>Add source</SecondaryButton>
                <Form onSubmit={addDatasetHandler}>
                  {form => (
                    <>
                      <ManagedRadioGroup<number>
                        form={form}
                        name="source"
                        options={datasetSources.map(s => ({
                          key: s.id,
                          value: s.id,
                          label: s.name,
                        }))}
                      />
                      <Labelled label="Timestamp">
                        <Flex>
                          <ManagedTextInput name="timestampColumn" form={form} placeholder="Timestamp column"/>
                          <ManagedTextInput name="timestampFormat" form={form} placeholder="Timestamp format"/>
                        </Flex>
                      </Labelled>
                      <Labelled label="Description">
                        <ManagedTextInput name="descriptionColumn" form={form} placeholder="Description column"/>
                      </Labelled>
                      <Labelled label="Amount">
                        <ManagedTextInput name="amountColumn" form={form} placeholder="Amount column"/>
                      </Labelled>
                      <Labelled label="Data">
                        <ManagedFileInput name="data" multiple={false} form={form}/>
                      </Labelled>
                      <DialogFooter>
                        <PrimaryButton submit>Add</PrimaryButton>
                        <SecondaryButton onClick={() => setAddDatasetDialogOpen(false)}>Cancel</SecondaryButton>
                      </DialogFooter>
                    </>
                  )}
                </Form>
              </>
            )}
          </Dialog>

          <Dialog open={addDatasetSourceDialogOpen} title="Add dataset source">
            <MaybeErrorAlert>{addDatasetSourceDialogError}</MaybeErrorAlert>
            <Form onSubmit={addDatasetSourceHandler}>
              {form => (
                <>
                  <Labelled label="Name"><ManagedTextInput form={form} name="name" autoFocus/></Labelled>
                  <Labelled label="Comment"><ManagedTextInput form={form} name="comment" lines={3}/></Labelled>
                  <DialogFooter>
                    <PrimaryButton submit>Add</PrimaryButton>
                    <SecondaryButton onClick={() => setAddDatasetSourceDialogOpen(false)}>Cancel</SecondaryButton>
                  </DialogFooter>
                </>
              )}
            </Form>
          </Dialog>
        </div>
      )}
    </RouteView>
  );
};
