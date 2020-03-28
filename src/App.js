import React, { useState, useEffect } from "react";
import classnames from "classnames";
import Axios from "axios";

import deleteSvg from "./static/delete.svg";

const FILTERS = {
  ALL: "ALL",
  DONE: "DONE",
  UNDONE: "UNDONE"
};

const BASE = "http://localhost:4000/v1/tasks";
const ajax = {
  getAllTasks: () => Axios.get(BASE),
  storeTask: body => Axios.post(BASE, body),
  updateTask: (id, body) => Axios.put(`${BASE}/${id}`, body),
  destroyTask: id => Axios.delete(`${BASE}/${id}`)
};

function App() {
  const [state, setState] = useState({
    task: "",
    items: [],
    filter: FILTERS.ALL,
    toggle: false
  });

  useEffect(() => {
    ajax
      .getAllTasks()
      .then(({ data }) => {
        setState(state => ({ ...state, items: data }));
      })
      .catch(err => {
        console.log("err", err);
      });
  }, []);

  const { task, items, filter, toggle } = state;

  const handleChange = e => {
    const { value } = e.target;
    setState(state => ({ ...state, task: value }));
  };

  const handleEnter = e => {
    if (e.keyCode !== 13 || !task) {
      return;
    }
    const body = { task, done: 0 };
    ajax
      .storeTask(body)
      .then(({ data }) => {
        setState(state => ({
          ...state,
          task: "",
          items: [data, ...state.items]
        }));
      })
      .catch(err => {
        console.err("err", err);
      });
  };

  const handleToggle = () => {
    const toggleValue = !state.toggle;
    const done = toggleValue ? 1 : 0;
    const promises = items.map(i => ajax.updateTask({ ...i, done }));
    Promise.all(promises)
      .then(() => {
        setState(state => ({
          ...state,
          toggle: toggleValue,
          items: items.map(i => ({ ...i, done }))
        }));
      })
      .catch(err => {
        console.log("err", err);
      });
  };

  const handleDone = id => {
    const item = items.find(i => +i.id === +id);
    const done = +item.done === 1 ? 0 : 1;
    ajax
      .updateTask(id, { ...item, done })
      .then(() => {
        setState(state => ({
          ...state,
          items: items.map(i => {
            if (i.id === id) {
              return { ...i, done };
            }
            return i;
          })
        }));
      })
      .catch(err => {
        console.log("err", err);
      });
  };

  const handleDestroy = id => {
    console.log("destroy", id);
    ajax
      .destroyTask(id)
      .then(() => {
        setState(state => ({
          ...state,
          items: items.filter(i => +i.id !== +id)
        }));
      })
      .catch(err => {
        console.log("err", err);
      });
  };

  const handleClean = () => {
    const promises = items.filter(i => i.done).map(i => ajax.destroyTask(i.id));
    Promise.all(promises)
      .then(() => {
        setState(state => ({
          ...state,
          items: state.items.filter(i => !i.done)
        }));
      })
      .catch(err => {
        console.log("err", err);
      });
  };

  const handleFilter = v => setState(state => ({ ...state, filter: v }));

  const totalLeft = items.filter(i => !i.done).length;

  const itemsFiltered = items.filter(i => {
    if (filter === FILTERS.DONE) {
      return +i.done === 1;
    }
    if (filter === FILTERS.UNDONE) {
      return +i.done === 0;
    }
    return true;
  });

  const showCompleteAll = items.some(i => i.done);

  return (
    <div className="App">
      <h1>Todo List</h1>
      <div className="limiter">
        <div className="box box--insert">
          <label className="check" htmlFor="all">
            <input
              type="checkbox"
              id="all"
              checked={toggle}
              onChange={handleToggle}
            />
          </label>
          <input
            type="text"
            placeholder="What need to be done"
            className="input-insert"
            value={task}
            onChange={handleChange}
            onKeyDown={handleEnter}
          ></input>
        </div>
        <div className="box box--action">
          <div className="action">
            <span>
              <strong>{totalLeft}</strong> items left
            </span>
          </div>
          <div className="action">
            <span
              className={classnames("button", {
                "button--selected": filter === FILTERS.ALL
              })}
              onClick={() => handleFilter(FILTERS.ALL)}
            >
              All
            </span>
          </div>
          <div className="action">
            <span
              className={classnames("button", {
                "button--selected": filter === FILTERS.UNDONE
              })}
              onClick={() => handleFilter(FILTERS.UNDONE)}
            >
              Active
            </span>
          </div>
          <div className="action">
            <span
              className={classnames("button", {
                "button--selected": filter === FILTERS.DONE
              })}
              onClick={() => handleFilter(FILTERS.DONE)}
            >
              Completed
            </span>
          </div>
          <div className="action">
            {showCompleteAll && (
              <span
                className="button button--danger"
                onClick={() => handleClean()}
              >
                Clear
              </span>
            )}
          </div>
        </div>
        <ul className="list">
          {itemsFiltered.map(item => {
            const { id, done } = item;
            return (
              <li key={id}>
                <label className="check" htmlFor={`id${id}`}>
                  <input
                    type="checkbox"
                    id={`id${id}`}
                    onChange={() => handleDone(id)}
                    checked={+done === 1}
                  />
                </label>
                <div className={classnames("text", { completed: item.done })}>
                  <span>{item.task}</span>
                </div>
                <label className="check remove">
                  <button
                    type="button"
                    className="none"
                    onClick={() => handleDestroy(id)}
                  >
                    <img src={deleteSvg} alt="" />
                  </button>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default App;
