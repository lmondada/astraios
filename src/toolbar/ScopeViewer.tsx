import { Scope } from "../App";

type ScopeViewerProps = {
  scope: Scope;
};

export default function ScopeViewer({ scope }: ScopeViewerProps) {
  return (
    <div className="p-3 pt-5">
      <table className="w-full">
        <thead className="w-ful">
          <tr className="w-full">
            <th className="min-w-1/2">Variable</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {scope.map(({ varName, varType }) => (
            <tr>
              <td>{varName}</td>
              <td>{varType}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
