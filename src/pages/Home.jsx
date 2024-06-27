import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
//import { useCookies } from "react-cookie";
import axios from "axios";
import { Header } from "../components/Header";
import { url, token } from "../const";
import "./home.scss";
import { format, differenceInMinutes } from "date-fns";

export const Home = () => {
  const [isDoneDisplay, setIsDoneDisplay] = useState("todo"); // todo->未完了 done->完了
  const [lists, setLists] = useState([]);
  const [selectListId, setSelectListId] = useState();
  const [tasks, setTasks] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  //const [cookies] = useCookies();
  const handleIsDoneDisplayChange = (e) => setIsDoneDisplay(e.target.value);
  useEffect(() => {
    axios
      .get(`${url}/lists`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setLists(res.data);
      })
      .catch((err) => {
        setErrorMessage(`リストの取得に失敗しました。${err}`);
      });
  }, []);

  useEffect(() => {
    const listId = lists[0]?.id;
    if (typeof listId !== "undefined") {
      setSelectListId(listId);
      axios
        .get(`${url}/lists/${listId}/tasks`, {
          headers: {
            authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          setTasks(res.data.tasks);
        })
        .catch((err) => {
          setErrorMessage(`タスクの取得に失敗しました。${err}`);
        });
    }
  }, [lists]);

  const handleSelectList = (id) => {
    setSelectListId(id);
    axios
      .get(`${url}/lists/${id}/tasks`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setTasks(res.data.tasks);
      })
      .catch((err) => {
        setErrorMessage(`タスクの取得に失敗しました。${err}`);
      });
  };

  return (
    <div>
      <Header />
      <main className="taskList">
        <p className="error-message">{errorMessage}</p>
        <div>
          <div className="list-header">
            <h2>リスト一覧</h2>
            <div className="list-menu">
              <p>
                <Link to="/list/new">リスト新規作成</Link>
              </p>
              <p>
                <Link to={`/lists/${selectListId}/edit`}>
                  選択中のリストを編集
                </Link>
              </p>
            </div>
          </div>
          <ul className="list-tab">
            {lists.map((list, key) => {
              const isActive = list.id === selectListId;
              return (
                <li
                  key={key}
                  role="tab"
                  id={`tab-${list.tab}`}
                  className={`list-tab-item ${isActive ? "active" : ""}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${list.id}`}
                  onClick={() => handleSelectList(list.id)}
                  tabIndex={isActive ? 0 : -1}
                >
                  <button className={`tab-button ${isActive ? "active" : ""}`}>
                    {list.title}
                  </button>
                </li>
              );
            })}
          </ul>
          {lists.map((list, key) => {
            const isActive = list.id === selectListId;
            return (
              <div
                key={key}
                role="tabpanel"
                id={`panel-${list.id}`}
                aria-labelledby={`tab-${list.id}`}
                hidden={!isActive}
              >
                <p>{list.title}</p>
              </div>
            );
          })}
          <div className="tasks">
            <div className="tasks-header">
              <h2>タスク一覧</h2>
              <Link to="/task/new">タスク新規作成</Link>
            </div>
            <div className="display-select-wrapper">
              <select
                onChange={handleIsDoneDisplayChange}
                className="display-select"
              >
                <option value="todo">未完了</option>
                <option value="done">完了</option>
              </select>
            </div>
            <Tasks
              tasks={tasks}
              selectListId={selectListId}
              isDoneDisplay={isDoneDisplay}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

// 期限と残り時間の計算
const TaskItem = ({ task, selectListId }) => {
  const now = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'");
  const remainingMinutes = differenceInMinutes(task.limit, now);
  const remainingtime = () => {
    if (remainingMinutes < 0) {
      return "時間切れ";
    } else {
      const days = Math.trunc(remainingMinutes / 1440);
      const hour = Math.trunc((remainingMinutes % 1440) / 60);
      const minutes = Math.trunc((remainingMinutes % 1440) % 60);

      return "残り時間:" + days + "日" + hour + "時間" + minutes + "分";
    }
  };

  const localDate = (limit) => {
    const date = new Date(limit);
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localtime = new Date(date.getTime() + timezoneOffset);

    return format(localtime, "MM/dd HH:mm");
  };

  return (
    <li className="task-item">
      <Link
        to={`/lists/${selectListId}/tasks/${task.id}`}
        className="task-item-link"
      >
        {task.title}
        <br />
        {"期限：" + localDate(task.limit)}
        <br />
        {remainingtime()}
      </Link>
    </li>
  );
};

// 表示するタスク
const Tasks = (props) => {
  const { tasks, selectListId, isDoneDisplay } = props;
  if (tasks === null) return <></>;

  if (isDoneDisplay == "done") {
    return (
      <ul>
        {tasks
          .filter((task) => {
            return task.done === true;
          })
          .map((task, key) => (
            <TaskItem key={key} task={task} selectListId={selectListId} />
          ))}
      </ul>
    );
  }

  return (
    <ul>
      {tasks
        .filter((task) => {
          return task.done === false;
        })
        .map((task, key) => (
          <TaskItem key={key} task={task} selectListId={selectListId} />
        ))}
    </ul>
  );
};
