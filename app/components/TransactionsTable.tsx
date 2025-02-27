import React, { useState, useEffect, useContext } from 'react';
import useSWR from 'swr';
import { fetcher } from 'utils/fetcher';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import { abi } from 'abi/MultiSigWallet.json';
import { TransactionRow } from 'components/TransactionRow';
import { TxModal } from 'components/TxModal';
import { ModalContext } from 'components/Modal';
import { ToastContext } from 'components/Toast';

export const TransactionTable = ({ address }) => {
  const { library, account, chainId } = useWeb3React<Web3Provider>();
  const { setModalContent, setModalVisible } = useContext(ModalContext);
  const { setToast } = useContext(ToastContext);
  const [paginationIndex, setPaginationIndex] = useState(0);

  let { data: transactionCount, mutate } = useSWR(library ? [address, 'transactionCount'] : null, {
    fetcher: fetcher(library, abi),
  });
  const contract = new Contract(address, abi);

  useEffect(() => {
    mutate(undefined, true);
  }, [chainId]);

  useEffect(() => {
    if (!library) return;

    const submission = contract.filters.Submission(null);

    library.on(submission, (event) => {
      console.log('submission', { event });
      mutate(undefined, true);
    });
    return () => {
      library.removeAllListeners(submission);
    };
  }, [library]);

  const addNewTx = () => {
    if (!account)
      return setToast({
        type: 'error',
        content: 'Please connect your wallet before you add a transaction.',
        timeout: 5000,
      });
    setModalContent(<TxModal address={address} />);
    setModalVisible(true);
  };
  if (!transactionCount) return <></>;
  const parsedTxCount = parseInt(transactionCount.toString());
  const txPerPage = 5;
  const pageCount = Math.ceil(parsedTxCount / txPerPage);
  const cellStyle = 'border border-gray-500 p-2';
  return (
    <div className="my-10">
      <div className="flex items-center my-5">
        <h2 className="block text-xl mr-2">Transactions</h2>
        <div>
          <button
            className="bg-gradient-to-r from-green-400 to-blue-500 px-3 py-2 text-white text-sm font-semibold rounded"
            onClick={addNewTx}
          >
            Add new transaction
          </button>
        </div>
      </div>
      <table className="table-auto font-mono border border-gray-500 w-full">
        <thead>
          <tr>
            <th className={cellStyle}>ID</th>
            <th className={cellStyle}>Destination</th>
            <th className={cellStyle}>Data</th>
            <th className={cellStyle}>Owner Signatures</th>
            <th className={cellStyle}>Status</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(parsedTxCount).keys()]
            .reverse()
            .slice(paginationIndex * txPerPage, paginationIndex * txPerPage + txPerPage)
            .map((id) => (
              <TransactionRow key={id} address={address} transactionId={id} cellStyle={cellStyle} />
            ))}
        </tbody>
      </table>
      <div className="mt-2 text-right">
        {paginationIndex > 0 && (
          <button
            className="mr-3 text-sm border border-gray-300 px-2"
            onClick={() => setPaginationIndex(paginationIndex - 1)}
          >
            Prev{' '}
          </button>
        )}
        Page {paginationIndex + 1} of {pageCount}
        {paginationIndex !== pageCount - 1 && (
          <button
            className="ml-3 text-sm border border-gray-300 px-2"
            onClick={() => setPaginationIndex(paginationIndex + 1)}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};
